import React from "react";
import {expect, describe, jest, it, beforeEach} from "@jest/globals";
import {fireEvent} from "@testing-library/dom";
import {act} from "react-dom/test-utils";
import api from "../api";
import {render, screen} from "./custom_testing_lib/custom-testing-lib";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import ErrorsModal from "../components/ErrorsModal";
import BulkAddDeviceModal from "../components/groups/BulkAddDeviceModal";

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

        // FormRows renders its own "Add" button inside the container we tag via
        // data-test - the button itself carries the library's fixed data-test="add-row",
        // mirroring the pattern used for VarBinds/FieldPatterns in AddProfileModal.test.jsx.
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
})
