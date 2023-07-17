import React from "react";
import {expect, describe, it} from "@jest/globals";
import {fireEvent} from "@testing-library/dom";
import {render, screen} from "./custom_testing_lib/custom-testing-lib";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import {MockInventoryValidationContextProvider} from "./mock_context_providers/MockInventoryValidationContextProvider";
import AddDeviceModal from "../components/groups/AddDeviceModal";

function renderModal(){
    return render(
        <MockErrorsContextProvider>
            <MockGroupContextProvider>
                <MockInventoryValidationContextProvider>
                    <AddDeviceModal/>
                </MockInventoryValidationContextProvider>
            </MockGroupContextProvider>
        </MockErrorsContextProvider>
    )
}

describe("AddDeviceModal", () => {
    it("Test invalid IPv4 address and no community string",() => {
        renderModal();

        const submitButton = screen.getByDataTest("form:submit-form-button");
        const addressInput = screen.getByDataTest('form:ip-input').querySelector("input");
        const communityInput = screen.getByDataTest('form:community-input').querySelector("input");


        fireEvent.change(addressInput, {target: {value: "1.2.3.4"}})
        fireEvent.change(communityInput, {target: {value: ""}})
        fireEvent.click(submitButton);


        expect(screen.queryByText("Provided address isn't a valid IPv4 address")).not.toBeInTheDocument();
        expect(screen.queryByText("When using SNMP version 1 or 2c, community string must be specified")).toBeInTheDocument();


        fireEvent.change(addressInput, {target: {value: "1.2. 3.4"}})
        fireEvent.change(communityInput, {target: {value: "public"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Provided address isn't a valid IPv4 address")).toBeInTheDocument();
        expect(screen.queryByText("When using SNMP version 1 or 2c, community string must be specified")).not.toBeInTheDocument();
    })

    it("Test no IPv4 and walk interval below 1800", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const addressInput = screen.getByDataTest('form:ip-input').querySelector("input");

        fireEvent.change(addressInput, {target: {value: ""}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Address is required")).toBeInTheDocument();
    })

    it("Test wrong port", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const portInput = screen.getByDataTest("form:port-input").querySelector("input");

        fireEvent.change(portInput, {target: {value: ""}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Port number must be specified")).not.toBeInTheDocument();

        fireEvent.change(portInput, {target: {value: "a"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Port number must be an integer in range 1-65535")).toBeInTheDocument();

        fireEvent.change(portInput, {target: {value: "65536"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Port number must be an integer in range 1-65535")).toBeInTheDocument();
    })

    it("Test wrong security engine", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const securityEngineInput = screen.getByDataTest("form:security-engine-input").querySelector("input")

        fireEvent.change(securityEngineInput, {target: {value: "a"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("If provided, Security Engine can consists only of 10-64 characters in hexadecimal" +
            " notation. All letter must be either upper or lowe case.")).toBeInTheDocument();

        fireEvent.change(securityEngineInput, {target: {value: "aaaabb2313njouoaoa22asd"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("If provided, Security Engine can consists only of 10-64 characters in hexadecimal" +
            " notation. All letter must be either upper or lowe case.")).toBeInTheDocument();
    })
})
