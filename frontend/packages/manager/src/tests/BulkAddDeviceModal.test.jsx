import React, { act } from "react";
import {expect, describe, jest, it, beforeEach} from "@jest/globals";
import {fireEvent} from "@testing-library/dom";
import api from "../api";
import {render, screen} from "./custom_testing_lib/custom-testing-lib";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import ErrorsModal from "../components/ErrorsModal";
import BulkAddDeviceModal, {parseAddressList, expandAddresses} from "../components/groups/BulkAddDeviceModal";

function renderModal(){
    return render(
        <MockErrorsContextProvider>
            <MockGroupContextProvider>
                <BulkAddDeviceModal/>
                <ErrorsModal/>
            </MockGroupContextProvider>
        </MockErrorsContextProvider>
    )
}

const sleep = ms => new Promise(r => { setTimeout(r, ms); });

jest.mock("../api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            response: { use: jest.fn() },
        },
    },
}))

describe("BulkAddDeviceModal", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
    });

    it("adds another row when 'Add row' is clicked", () => {
        renderModal();

        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);

        const addRowButton = screen.getByDataTest("sc4snmp:bulk:add-row").querySelector('[data-test="add-row"]');
        fireEvent.click(addRowButton);

        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(2);
    })

    it("surfaces invalid rows inline without calling the API", async () => {
        renderModal();

        const addressInput = screen.getByDataTest("sc4snmp:bulk:address-input").querySelector("input");
        const communityInput = screen.getByDataTest("sc4snmp:bulk:community-input").querySelector("input");
        const submitButton = screen.getByDataTest("sc4snmp:bulk:submit-button");

        // Invalid address (contains a space) and missing community for the default (v1/2c) version.
        fireEvent.change(addressInput, {target: {value: "1.2. 3.4"}})
        fireEvent.change(communityInput, {target: {value: ""}})
        await act(async () => {
            fireEvent.click(submitButton);
            await sleep(10);
        });

        expect(screen.queryByText("Address or host name can consist only of upper and lower english letters, " +
            "\" + \"numbers and three special characters: '-', '.' and '_'. No spaces are allowed.")).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    })

    it("posts valid rows to /devices/add/bulk and keeps failed rows visible on partial success", async () => {
        api.post.mockResolvedValueOnce({data: {
            added: 1,
            failed: 1,
            results: [
                {index: 0, address: "2.2.2.2", port: null, added: true, message: null},
                {index: 1, address: "5.5.5.5", port: 161, added: false,
                 message: "Host 5.5.5.5:161 already exists in the inventory. Record was not added."},
            ],
        }});
        renderModal();

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:add-row").querySelector('[data-test="add-row"]'));

        const addressInputs = screen.getAllByDataTest("sc4snmp:bulk:address-input").map((el) => el.querySelector("input"));
        const secretInputs = screen.getAllByDataTest("sc4snmp:bulk:secret-input").map((el) => el.querySelector("input"));

        fireEvent.change(addressInputs[0], {target: {value: "2.2.2.2"}})
        fireEvent.change(secretInputs[0], {target: {value: "snmpv3"}})
        fireEvent.change(addressInputs[1], {target: {value: "5.5.5.5"}})
        fireEvent.change(secretInputs[1], {target: {value: "snmpv3"}})

        const submitButton = screen.getByDataTest("sc4snmp:bulk:submit-button");
        await act(async () => {
            fireEvent.click(submitButton);
            await sleep(10);
        });

        expect(api.post).toHaveBeenCalledWith("/devices/add/bulk", expect.objectContaining({
            devices: [
                expect.objectContaining({address: "2.2.2.2"}),
                expect.objectContaining({address: "5.5.5.5"}),
            ],
        }));

        // Only the failed row remains, with its rejection message shown inline.
        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);
        expect(screen.queryByText("Host 5.5.5.5:161 already exists in the inventory. Record was not added.")).toBeInTheDocument();
        expect(screen.getByDataTest("sc4snmp:bulk:address-input").querySelector("input").value).toBe("5.5.5.5");
    })

    it("resets the grid to a single blank row when the whole batch succeeds", async () => {
        api.post.mockResolvedValueOnce({data: {
            added: 1,
            failed: 0,
            results: [
                {index: 0, address: "2.2.2.2", port: null, added: true, message: null},
            ],
        }});
        renderModal();

        const addressInput = screen.getByDataTest("sc4snmp:bulk:address-input").querySelector("input");
        const secretInput = screen.getByDataTest("sc4snmp:bulk:secret-input").querySelector("input");
        fireEvent.change(addressInput, {target: {value: "2.2.2.2"}})
        fireEvent.change(secretInput, {target: {value: "snmpv3"}})

        const submitButton = screen.getByDataTest("sc4snmp:bulk:submit-button");
        await act(async () => {
            fireEvent.click(submitButton);
            await sleep(10);
        });

        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);
        expect(screen.getByDataTest("sc4snmp:bulk:address-input").querySelector("input").value).toBe("");
    })

    it("shows the errors modal when the request fails outright", async () => {
        api.post.mockRejectedValueOnce({response: {data: {message: "Group with id 1 was not found."}}});
        renderModal();

        const addressInput = screen.getByDataTest("sc4snmp:bulk:address-input").querySelector("input");
        const secretInput = screen.getByDataTest("sc4snmp:bulk:secret-input").querySelector("input");
        fireEvent.change(addressInput, {target: {value: "2.2.2.2"}})
        fireEvent.change(secretInput, {target: {value: "snmpv3"}})

        const submitButton = screen.getByDataTest("sc4snmp:bulk:submit-button");
        await act(async () => {
            fireEvent.click(submitButton);
            await sleep(10);
        });

        expect(screen.queryByText("Group with id 1 was not found.")).toBeInTheDocument();
    })

    it("expands a pasted address list with the shared config into the preview grid", () => {
        renderModal();

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:mode-paste"));

        const portInput = screen.getByDataTest("sc4snmp:bulk:shared-port-input").querySelector("input");
        const communityInput = screen.getByDataTest("sc4snmp:bulk:shared-community-input").querySelector("input");
        const pasteInput = screen.getByDataTest("sc4snmp:bulk:paste-input").querySelector('textarea[data-test="textbox"]');

        fireEvent.change(portInput, {target: {value: "161"}})
        fireEvent.change(communityInput, {target: {value: "public"}})
        // Blank line, a comment line, and a duplicate should all be dropped by expandAddresses.
        fireEvent.change(pasteInput, {target: {value: "1.1.1.1\n\n# a comment\n2.2.2.2\n1.1.1.1"}})

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:expand-button"));

        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(2);
        const addressInputs = screen.getAllByDataTest("sc4snmp:bulk:address-input").map((el) => el.querySelector("input"));
        expect(addressInputs.map((input) => input.value)).toEqual(["1.1.1.1", "2.2.2.2"]);
        const portInputs = screen.getAllByDataTest("sc4snmp:bulk:port-input").map((el) => el.querySelector("input"));
        expect(portInputs.every((input) => input.value === "161")).toBe(true);
        const communityInputs = screen.getAllByDataTest("sc4snmp:bulk:community-input").map((el) => el.querySelector("input"));
        expect(communityInputs.every((input) => input.value === "public")).toBe(true);
    })

    it("clears the blank manual row as soon as paste mode is selected, and reseeds it going back", () => {
        const {container} = renderModal();

        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:mode-paste"));
        expect(container.querySelectorAll('[data-test="sc4snmp:bulk:row"]')).toHaveLength(0);

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:mode-manual"));
        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);
    })

    it("disables Submit and shows a hint while the grid is empty, then re-enables it once addresses are added", () => {
        renderModal();

        const submitButton = screen.getByDataTest("sc4snmp:bulk:submit-button");
        expect(submitButton).not.toHaveAttribute("aria-disabled", "true");

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:mode-paste"));
        expect(screen.getByDataTest("sc4snmp:bulk:submit-button")).toHaveAttribute("aria-disabled", "true");
        expect(screen.getByDataTest("sc4snmp:bulk:empty-grid-hint")).toBeInTheDocument();

        const pasteInput = screen.getByDataTest("sc4snmp:bulk:paste-input").querySelector('textarea[data-test="textbox"]');
        fireEvent.change(pasteInput, {target: {value: "1.1.1.1"}})
        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:expand-button"));

        expect(screen.getByDataTest("sc4snmp:bulk:submit-button")).not.toHaveAttribute("aria-disabled", "true");
    })

    it("drops the leftover blank manual row when expanding pasted addresses", () => {
        renderModal();

        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);

        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:mode-paste"));
        const pasteInput = screen.getByDataTest("sc4snmp:bulk:paste-input").querySelector('textarea[data-test="textbox"]');
        fireEvent.change(pasteInput, {target: {value: "1.1.1.1"}})
        fireEvent.click(screen.getByDataTest("sc4snmp:bulk:expand-button"));

        // Only the expanded row should remain - the original untouched blank row is dropped.
        expect(screen.getAllByDataTest("sc4snmp:bulk:row")).toHaveLength(1);
        expect(screen.getByDataTest("sc4snmp:bulk:address-input").querySelector("input").value).toBe("1.1.1.1");
    })
})

describe("parseAddressList", () => {
    it("splits pasted text on newlines and commas", () => {
        expect(parseAddressList("1.1.1.1\n2.2.2.2,3.3.3.3")).toEqual(["1.1.1.1", "2.2.2.2", "3.3.3.3"]);
    })
})

describe("expandAddresses", () => {
    const sharedConfig = {port: "161", version: "2c", community: "public", secret: "", securityEngine: ""};

    it("trims, drops blank/#-comment lines, dedups, and applies the shared config to every row", () => {
        const rows = expandAddresses(
            ["  1.1.1.1  ", "", "   ", "# a comment", "2.2.2.2", "1.1.1.1"],
            sharedConfig
        );

        expect(rows.map((row) => row.address)).toEqual(["1.1.1.1", "2.2.2.2"]);
        rows.forEach((row) => {
            expect(row.port).toBe("161");
            expect(row.version).toBe("2c");
            expect(row.community).toBe("public");
            expect(row.errors).toEqual({});
            expect(row.status).toBeNull();
        });
    })

    it("returns an empty array when every address is blank or a comment", () => {
        expect(expandAddresses(["", "  ", "# nothing here"], sharedConfig)).toEqual([]);
    })
})
