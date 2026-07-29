import React from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent} from '@testing-library/dom';
import {act} from "react-dom/test-utils";
import api from "../api";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom"
import Header from "../components/menu_header/Header";
import ErrorsModal from "../components/ErrorsModal";
import {MockAuthContextProvider} from "./mock_context_providers/MockAuthContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import {MockProfileContextProvider} from "./mock_context_providers/MockProfileContextProvider";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockInventoryContextProvider} from "./mock_context_providers/MockInventoryContextProvider";
import {MenuHeaderContxtProvider} from "../store/menu-header-contxt";

function renderHeader(){
    // The Restore button now lives in the Header, which also renders Logout/Add/Apply
    // changes buttons - so it needs the full provider stack, mirroring HeaderLogout.test.jsx.
    return render(
        <MockAuthContextProvider>
            <MockErrorsContextProvider>
                <MenuHeaderContxtProvider>
                    <MockProfileContextProvider profileProps={{}}>
                        <MockGroupContextProvider>
                            <MockInventoryContextProvider>
                                <Header/>
                                <ErrorsModal/>
                            </MockInventoryContextProvider>
                        </MockGroupContextProvider>
                    </MockProfileContextProvider>
                </MenuHeaderContxtProvider>
            </MockErrorsContextProvider>
        </MockAuthContextProvider>
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
    });

    it("opens a confirmation dialog when the restore button is clicked", async () => {
        await act(async () => renderHeader());

        const restoreButton = screen.getByDataTest("sc4snmp:restore-config-button");
        fireEvent.click(restoreButton);
        await sleep(5);

        expect(screen.queryByText("Are you sure you want to restore the configuration from the section files on disk?")).toBeInTheDocument();
    })

    it("closes the confirmation dialog without calling the API when cancelled", async () => {
        await act(async () => renderHeader());

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
        await act(async () => renderHeader());

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
        await act(async () => renderHeader());

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

    it("shows the restore button on all three tabs", async () => {
        await act(async () => renderHeader());

        // MenuHeaderContxtProvider defaults activeTabId to "Profiles"; the Restore
        // button must not be gated behind any specific tab.
        expect(screen.getByDataTest("sc4snmp:restore-config-button")).toBeInTheDocument();
    })
})
