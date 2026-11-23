import React, { act } from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent, within} from '@testing-library/dom';
import api from "../api";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom"
import DiscoveryList from "../components/discovery/DiscoveryList";
import {ButtonsContextProvider} from "../store/buttons-contx";
import {MockDiscoveryContextProvider, discoveryMocks} from "./mock_context_providers/MockDiscoveryContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";

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

const sleep = ms => new Promise(r => { setTimeout(r, ms); });

const rows = [
    {_id: "id1", name: "office-lan", networkAddress: "10.0.0.0/24", version: "2c", port: "161", community: "public",
        secret: "", securityEngine: "", frequency: "86400", deleteAlreadyDiscovered: false,
        deviceRules: [{name: "routers", patterns: "*Cisco IOS*", group: "routers"},
                      {name: "routers", patterns: "*Juniper*", group: "juniper"}]},
    {_id: "id2", name: "dc-v3", networkAddress: "10.20.0.0/22", version: "3", port: "161", community: "",
        secret: "snmp-ro", securityEngine: "", frequency: "43200", deleteAlreadyDiscovered: true, deviceRules: []},
];

function mockApi({count = 2} = {}) {
    api.get.mockImplementation((url) => {
        if (url === "/discovery/count") { return Promise.resolve({data: count}); }
        if (url.startsWith("/discovery/")) { return Promise.resolve({data: rows}); }
        return Promise.resolve({data: []});
    });
}

function renderList(){
    return render(
        <MockErrorsContextProvider>
            <ButtonsContextProvider>
                <MockDiscoveryContextProvider>
                    <DiscoveryList/>
                </MockDiscoveryContextProvider>
            </ButtonsContextProvider>
        </MockErrorsContextProvider>
    );
}

describe("DiscoveryList", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        discoveryMocks.setAddOpen.mockReset();
        discoveryMocks.makeChange.mockReset();
        mockApi();
    });

    it("renders entries from the API", async () => {
        await act(async () => renderList());
        expect(api.get).toHaveBeenCalledWith("/discovery/count");
        expect(api.get).toHaveBeenCalledWith("/discovery/1/20");
        expect(screen.getAllByDataTest("sc4snmp:discovery-row")).toHaveLength(2);
        expect(screen.getByText("office-lan")).toBeInTheDocument();
        expect(screen.getByText("10.20.0.0/22")).toBeInTheDocument();
        expect(screen.getByText("snmp-ro")).toBeInTheDocument();
        expect(screen.getAllByDataTest("sc4snmp:discovery-community")[1]).toHaveTextContent(/^$/);
        expect(screen.getAllByDataTest("sc4snmp:discovery-secret")[0]).toHaveTextContent(/^$/);
        screen.getAllByDataTest("sc4snmp:discovery-security-engine").forEach((cell) => {
            expect(cell).toHaveTextContent(/^$/);
        });
    });

    it("expands a row to show device rules in order, even with repeated rule names", async () => {
        await act(async () => renderList());
        expect(screen.queryByText(/Cisco IOS/)).not.toBeInTheDocument();
        const expandButtons = screen.getAllByRole("button", {name: /expand/i});
        await act(async () => { fireEvent.click(expandButtons[0]); });
        const rulesTable = screen.getByRole("table", {name: "Device rules for office-lan"});
        expect(screen.queryByText("Device rules for office-lan")).not.toBeInTheDocument();
        expect(within(rulesTable).getAllByRole("columnheader").map((cell) => cell.textContent))
            .toEqual(["Rule name", "Pattern", "Group name"]);
        const items = screen.getAllByDataTest("sc4snmp:discovery-rule-row");
        expect(items).toHaveLength(2);
        expect(within(items[0]).getAllByRole("cell").map((cell) => cell.textContent))
            .toEqual(["routers", "*Cisco IOS*", "routers"]);
        expect(within(items[1]).getAllByRole("cell").map((cell) => cell.textContent))
            .toEqual(["routers", "*Juniper*", "juniper"]);
    });

    it("opens the edit modal for a row", async () => {
        await act(async () => renderList());
        fireEvent.click(screen.getAllByDataTest("sc4snmp:discovery-row-edit")[0]);
        expect(discoveryMocks.setAddOpen).toHaveBeenCalledWith(true);
    });

    it("deletes an entry after confirmation", async () => {
        api.post.mockResolvedValue({data: {message: "Discovery entry was deleted."}});
        await act(async () => renderList());
        fireEvent.click(screen.getAllByDataTest("sc4snmp:discovery-row-delete")[1]);
        expect(screen.getByText("Are you sure you want to delete dc-v3 ?")).toBeInTheDocument();
        await act(async () => { fireEvent.click(screen.getByDataTest("sc4snmp:delete-modal:delete-button")); });
        await sleep(10);
        expect(api.post).toHaveBeenCalledWith("/discovery/delete/id2");
        expect(discoveryMocks.makeChange).toHaveBeenCalled();
    });

    it("fetches once when the page size changes and stays on the current page after a change", async () => {
        await act(async () => renderList());
        const pageFetches = () => api.get.mock.calls.filter(([url]) => /^\/discovery\/\d+\/\d+$/.test(url));
        expect(pageFetches()).toHaveLength(1);

        const select = screen.getByDataTest("sc4snmp:discovery-pagination");
        await act(async () => { fireEvent.click(select); });
        await act(async () => { fireEvent.click(screen.getByText("50")); });
        await sleep(10);
        expect(pageFetches()).toHaveLength(2);
        expect(pageFetches()[1][0]).toBe("/discovery/1/50");
    });
});
