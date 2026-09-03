import React, { act } from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent} from '@testing-library/dom';
import api from "../api";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom"
import GroupsList from "../components/groups/GroupsList";
import {ButtonsContextProvider} from "../store/buttons-contx";
import {InventoryDevicesValidationContxtProvider} from "../store/inventory-devices-validation-contxt";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";

function renderGroupsList(){
    // GroupsList also mounts AddDeviceModal, which reads the (unmocked, state-only)
    // device-validation context - no auth, profile or inventory providers are needed here.
    return render(
        <MockErrorsContextProvider>
            <ButtonsContextProvider>
                <InventoryDevicesValidationContxtProvider>
                    <MockGroupContextProvider>
                        <GroupsList/>
                    </MockGroupContextProvider>
                </InventoryDevicesValidationContxtProvider>
            </ButtonsContextProvider>
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

describe("GroupsList pagination", () => {
    beforeEach(() => {
        api.get.mockReset();
    });

    it("fetches the group count then the first page, and renders the returned groups", async () => {
        api.get.mockResolvedValueOnce({data: 2});
        api.get.mockResolvedValueOnce({data: [
            {_id: "1", groupName: "group1", groupInInventory: false},
            {_id: "2", groupName: "group2", groupInInventory: true},
        ]});

        await act(async () => renderGroupsList());
        await sleep(5);

        expect(api.get).toHaveBeenNthCalledWith(1, "/groups/count");
        expect(api.get).toHaveBeenNthCalledWith(2, "/groups/1/20");
        expect(screen.queryByText("group1")).toBeInTheDocument();
        expect(screen.queryByText("group2")).toBeInTheDocument();
    })

    it("does not fetch every group at once - only one page of results is requested", async () => {
        // With 2000 groups server-side the client must never ask for more than a page's
        // worth at a time; this is the fix for the multi-minute Groups tab freeze.
        api.get.mockResolvedValueOnce({data: 2000});
        api.get.mockResolvedValueOnce({data: [{_id: "1", groupName: "group1", groupInInventory: false}]});

        await act(async () => renderGroupsList());
        await sleep(5);

        expect(api.get).toHaveBeenCalledTimes(2);
        expect(api.get).toHaveBeenNthCalledWith(2, "/groups/1/20");
    })

    it("requests the next page of groups when the paginator is used", async () => {
        api.get.mockResolvedValueOnce({data: 100});
        api.get.mockResolvedValueOnce({data: [{_id: "1", groupName: "group1", groupInInventory: false}]});

        await act(async () => renderGroupsList());
        await sleep(5);
        expect(screen.queryByText("group1")).toBeInTheDocument();

        api.get.mockResolvedValueOnce({data: 100});
        api.get.mockResolvedValueOnce({data: [{_id: "2", groupName: "group2", groupInInventory: false}]});

        const pageTwoButton = screen.getByLabelText("Page 2");
        await act(async () => {
            fireEvent.click(pageTwoButton);
            await sleep(10);
        });

        expect(api.get).toHaveBeenNthCalledWith(3, "/groups/count");
        expect(api.get).toHaveBeenNthCalledWith(4, "/groups/2/20");
        expect(screen.queryByText("group2")).toBeInTheDocument();
        expect(screen.queryByText("group1")).not.toBeInTheDocument();
    })

    it("clamps to the last page when the current page no longer exists", async () => {
        // e.g. the only group left on the last page was just deleted.
        api.get.mockResolvedValueOnce({data: 0});
        api.get.mockResolvedValueOnce({data: []});

        await act(async () => renderGroupsList());
        await sleep(5);

        expect(api.get).toHaveBeenNthCalledWith(2, "/groups/1/20");
        expect(screen.queryByText("group1")).not.toBeInTheDocument();
    })
})
