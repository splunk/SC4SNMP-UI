import React from 'react';
import {expect, describe, it} from '@jest/globals';
import {render, screen} from './custom_testing_lib/custom-testing-lib';
import Header from "../components/menu_header/Header";
import {MockAuthContextProvider} from "./mock_context_providers/MockAuthContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import {MockProfileContextProvider} from "./mock_context_providers/MockProfileContextProvider";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockInventoryContextProvider} from "./mock_context_providers/MockInventoryContextProvider";
import {MenuHeaderContxtProvider} from "../store/menu-header-contxt";

function renderHeader(authOverrides = {}){
    return render(
        <MockAuthContextProvider overrides={authOverrides}>
            <MockErrorsContextProvider>
                <MenuHeaderContxtProvider>
                    <MockProfileContextProvider profileProps={{}}>
                        <MockGroupContextProvider>
                            <MockInventoryContextProvider>
                                <Header/>
                            </MockInventoryContextProvider>
                        </MockGroupContextProvider>
                    </MockProfileContextProvider>
                </MenuHeaderContxtProvider>
            </MockErrorsContextProvider>
        </MockAuthContextProvider>
    )
}

describe("Header logout visibility", () => {
    it("shows the Logout button when auth is enabled", () => {
        renderHeader({authEnabled: true});

        expect(screen.getByDataTest("sc4snmp:logout-button")).toBeInTheDocument();
    })

    it("hides the Logout button when auth is disabled", () => {
        renderHeader({authEnabled: false});

        expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    })
})
