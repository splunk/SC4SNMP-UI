import React, { act } from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import api from "../api";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom"
import DiscoveryPage from "../pages/DiscoveryPage";
import {ButtonsContextProvider} from "../store/buttons-contx";
import {DiscoveryContextProvider} from "../store/discovery-contxt";
import {DiscoveryValidationContextProvider} from "../store/discovery-validation-contxt";
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

function renderPage(){
    return render(
        <MockErrorsContextProvider>
            <ButtonsContextProvider>
                <DiscoveryContextProvider>
                    <DiscoveryValidationContextProvider>
                        <DiscoveryPage/>
                    </DiscoveryValidationContextProvider>
                </DiscoveryContextProvider>
            </ButtonsContextProvider>
        </MockErrorsContextProvider>
    );
}

const bannerText = /Discovery is disabled in Helm values/;

describe("DiscoveryPage", () => {
    beforeEach(() => {
        api.get.mockReset();
    });

    const mockStatus = (status) => api.get.mockImplementation((url) => {
        if (url === "/discovery/status") { return status; }
        if (url === "/discovery/count") { return Promise.resolve({data: 0}); }
        return Promise.resolve({data: []});
    });

    it("shows a banner when discovery is disabled", async () => {
        mockStatus(Promise.resolve({data: {enabled: false}}));
        await act(async () => renderPage());
        expect(screen.getByText(bannerText)).toBeInTheDocument();
    });

    it("shows no banner when discovery is enabled", async () => {
        mockStatus(Promise.resolve({data: {enabled: true}}));
        await act(async () => renderPage());
        expect(screen.queryByText(bannerText)).not.toBeInTheDocument();
    });

    it("shows no banner when the status request fails", async () => {
        mockStatus(Promise.reject(new Error("boom")));
        await act(async () => renderPage());
        expect(screen.queryByText(bannerText)).not.toBeInTheDocument();
    });
});
