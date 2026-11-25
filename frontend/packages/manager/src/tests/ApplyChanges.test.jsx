import React, { act } from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent, within} from '@testing-library/dom';
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
import MenuHeaderContxt from "../store/menu-header-contxt";

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
function renderHeader(activeTabId = "Profiles"){
    const menuContext = {activeTabId};
    return render(
        <MockAuthContextProvider>
            <MockErrorsContextProvider>
                <MenuHeaderContxt.Provider value={menuContext}>
                    <MockProfileContextProvider profileProps={{}}>
                        <MockGroupContextProvider>
                            <MockInventoryContextProvider>
                                <Header/>
                                <ErrorsModal/>
                            </MockInventoryContextProvider>
                        </MockGroupContextProvider>
                    </MockProfileContextProvider>
                </MenuHeaderContxt.Provider>
            </MockErrorsContextProvider>
        </MockAuthContextProvider>
    );
}

describe("Apply changes", () => {
    beforeEach(() => {
        api.post.mockReset();
    });

    it.each([
        ["Profiles", "inventory"],
        ["Groups", "inventory"],
        ["Inventory", "inventory"],
        ["Discovery", "discovery"],
    ])("applies the active section from the %s tab and shows the returned message", async (tab, section) => {
        api.post.mockResolvedValueOnce({data: {message: "Configuration will be updated in approximately 1 seconds."}});
        await act(async () => renderHeader(tab));
        await act(async () => {
            fireEvent.click(screen.getByDataTest("sc4snmp:apply-changes-button"));
            await sleep(10);
        });
        expect(api.post).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledWith("/apply-changes", null, {params: {section}});
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

    it("separates Inventory and Discovery results with bold headings and time values", async () => {
        api.post.mockResolvedValueOnce({data: {message:
            "Inventory: configuration will be updated in approximately 1 seconds. " +
            "Discovery: configuration will be updated in approximately 130 seconds."}});
        await act(async () => renderHeader());
        await act(async () => {
            fireEvent.click(screen.getByDataTest("sc4snmp:apply-changes-button"));
        });

        ["Inventory", "Discovery"].forEach((title, index) => {
            const heading = screen.getByText(title);
            const section = heading.parentElement;
            expect(heading.tagName).toBe("STRONG");
            expect(section).toHaveStyle({display: "block"});
            expect(heading.nextSibling.tagName).toBe("BR");
            const delay = index === 0 ? "1" : "130";
            expect(section).toHaveTextContent(`Configuration will be updated in approximately ${delay} seconds.`);
            expect(within(section).getByText(delay).tagName).toBe("STRONG");
        });
    });

    it("preserves retry and skipped-job details under their section headings", async () => {
        const retryMessage = "There might be previous kubernetes job still present. Configuration update will be retried 10 times.";
        const skippedMessage = "Skipped, discovery is disabled in the helm values (job configuration is not available).";
        api.post.mockResolvedValueOnce({data: {message:
            `Inventory: ${retryMessage} Discovery: ${skippedMessage}`}});
        await act(async () => renderHeader());
        await act(async () => {
            fireEvent.click(screen.getByDataTest("sc4snmp:apply-changes-button"));
        });

        expect(screen.getByText("Inventory").parentElement).toHaveTextContent(retryMessage);
        expect(screen.getByText("Discovery").parentElement).toHaveTextContent(skippedMessage);
    });
});
