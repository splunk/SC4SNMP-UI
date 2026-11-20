import React, { act } from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent} from '@testing-library/dom';
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

// Header is rendered without a DiscoveryContextProvider on purpose: it must work with the safe default.
function renderHeader(){
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
    );
}

describe("Apply changes", () => {
    beforeEach(() => {
        api.post.mockReset();
    });

    it("posts /apply-changes without a section and shows the returned message", async () => {
        api.post.mockResolvedValueOnce({data: {message: "Configuration will be updated in approximately 1 seconds."}});
        await act(async () => renderHeader());
        await act(async () => {
            fireEvent.click(screen.getByDataTest("sc4snmp:apply-changes-button"));
            await sleep(10);
        });
        expect(api.post).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledWith("/apply-changes");
        expect(screen.queryByText("Configuration will be updated in approximately 1 seconds.")).toBeInTheDocument();
    });

    it("shows the backend error message when apply fails", async () => {
        api.post.mockRejectedValueOnce({response: {data: {message: "Discovery job is not configured."}}});
        await act(async () => renderHeader());
        await act(async () => {
            fireEvent.click(screen.getByDataTest("sc4snmp:apply-changes-button"));
            await sleep(10);
        });
        expect(screen.queryByText("Error: Discovery job is not configured.")).toBeInTheDocument();
    });
});
