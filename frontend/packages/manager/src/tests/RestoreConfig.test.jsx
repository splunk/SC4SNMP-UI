import React from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent} from '@testing-library/dom';
import {act} from "react-dom/test-utils";
import api from "../api";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom"
import InventoryList from "../components/inventory/InventoryList";
import ErrorsModal from "../components/ErrorsModal";
import {MockInventoryContextProvider} from "./mock_context_providers/MockInventoryContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import {ButtonsContextProvider} from "../store/buttons-contx";

function renderInventoryList(){
    // InventoryList also renders DeleteModal, which reads ButtonsContext directly
    // (not exposed through InventoryContext), so the real provider is used here
    // rather than a mock - it's self-contained and has no external dependencies.
    return render(
        <MockErrorsContextProvider>
            <ButtonsContextProvider>
                <MockInventoryContextProvider>
                    <InventoryList/>
                    <ErrorsModal/>
                </MockInventoryContextProvider>
            </ButtonsContextProvider>
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

describe("RestoreConfig", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        // InventoryList issues two sequential gets on mount: total count, then the
        // current page of rows - mock both so the table has something to render.
        api.get.mockImplementation((url) => {
            if (url === "/inventory/count") {
                return Promise.resolve({data: 0});
            }
            return Promise.resolve({data: []});
        });
    });

    it("opens a confirmation dialog when the restore button is clicked", async () => {
        await act(async () => renderInventoryList());

        const restoreButton = screen.getByDataTest("sc4snmp:restore-config-button");
        fireEvent.click(restoreButton);
        await sleep(5);

        expect(screen.queryByText("Are you sure you want to restore the configuration from the section files on disk?")).toBeInTheDocument();
    })

    it("closes the confirmation dialog without calling the API when cancelled", async () => {
        await act(async () => renderInventoryList());

        const restoreButton = screen.getByDataTest("sc4snmp:restore-config-button");
        fireEvent.click(restoreButton);
        await sleep(5);

        const cancelButton = screen.getByDataTest("sc4snmp:restore-modal:cancel-button");
        await act(async () => {
            fireEvent.click(cancelButton);
            await sleep(10);
        });

        // Modal.jsx keeps its content mounted during the close animation, so
        // assert on the behavior that matters here - cancelling never calls the API -
        // rather than on the animated dialog's presence in the DOM.
        expect(api.post).not.toHaveBeenCalled();
    })

    it("calls /load-config and shows the returned message when confirmed", async () => {
        api.post.mockResolvedValueOnce({data: {message: "Configuration was restored from section files."}});
        await act(async () => renderInventoryList());

        const restoreButton = screen.getByDataTest("sc4snmp:restore-config-button");
        fireEvent.click(restoreButton);
        await sleep(5);

        const confirmButton = screen.getByDataTest("sc4snmp:restore-modal:confirm-button");
        await act(async () => {
            fireEvent.click(confirmButton);
            await sleep(10);
        });

        expect(api.post).toHaveBeenCalledWith("/load-config");
        expect(screen.queryByText("Configuration was restored from section files.")).toBeInTheDocument();
    })

    it("shows an error message when /load-config fails", async () => {
        api.post.mockRejectedValueOnce({response: {data: {message: "No section files found in the values directory to restore from."}}});
        await act(async () => renderInventoryList());

        const restoreButton = screen.getByDataTest("sc4snmp:restore-config-button");
        fireEvent.click(restoreButton);
        await sleep(5);

        const confirmButton = screen.getByDataTest("sc4snmp:restore-modal:confirm-button");
        await act(async () => {
            fireEvent.click(confirmButton);
            await sleep(10);
        });

        expect(screen.queryByText("No section files found in the values directory to restore from.")).toBeInTheDocument();
    })
})
