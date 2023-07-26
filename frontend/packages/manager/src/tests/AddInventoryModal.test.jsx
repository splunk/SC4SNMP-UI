import React from 'react';
import {expect, describe, jest, it} from '@jest/globals';
import {fireEvent} from '@testing-library/dom';
import axios from "axios";
import {act} from "react-dom/test-utils";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom/extend-expect"
import "@testing-library/jest-dom"
import AddInventoryModal from "../components/inventory/AddInventoryModal";
import {MockInventoryContextProvider} from "./mock_context_providers/MockInventoryContextProvider";
import {MockInventoryValidationContextProvider} from "./mock_context_providers/MockInventoryValidationContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";

function renderModal(){
    return render(
        <MockErrorsContextProvider>
            <MockInventoryContextProvider>
                <MockInventoryValidationContextProvider>
                    <AddInventoryModal/>
                </MockInventoryValidationContextProvider>
            </MockInventoryContextProvider>
        </MockErrorsContextProvider>
    )
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

jest.mock("axios")

describe("AddInventoryModal", () => {

    it("Test invalid IPv4 address and no community string",  async() => {
        axios.get.mockResolvedValueOnce({data:[]});
        await act( async () => renderModal());

        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const addressInput = screen.getByDataTest('sc4snmp:form:group-ip-input').querySelector("input");
        const communityInput = screen.getByDataTest('sc4snmp:form:community-input').querySelector("input");


        fireEvent.change(addressInput, {target: {value: "1.2.3.4"}})
        fireEvent.click(submitButton);


        expect(screen.queryByText("Provided address isn't a valid IPv4 address")).not.toBeInTheDocument();
        expect(screen.queryByText("When using SNMP version 1 or 2c, community string must be specified")).toBeInTheDocument();


        fireEvent.change(addressInput, {target: {value: "1.2. 3.4"}})
        fireEvent.change(communityInput, {target: {value: "public"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Provided address isn't a valid IPv4 address")).toBeInTheDocument();
        expect(screen.queryByText("When using SNMP version 1 or 2c, community string must be specified")).not.toBeInTheDocument();
    })

    it("Test no IPv4 and walk interval below 1800", async () => {
        axios.get.mockResolvedValueOnce({data:[]});
        await act( async () => renderModal());
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const addressInput = screen.getByDataTest('sc4snmp:form:group-ip-input').querySelector("input");
        const walkIntervalInput = screen.getByDataTest('sc4snmp:form:walk-interval-input').querySelector("input");

        fireEvent.change(addressInput, {target: {value: "group1"}})
        fireEvent.change(walkIntervalInput, {target: {value: 10}});
        fireEvent.click(submitButton);
        expect(screen.queryByText("Address or Group is required")).not.toBeInTheDocument();
        expect(screen.queryByText("Walk Interval number must be an integer greater than or equal 1800")).toBeInTheDocument();

        fireEvent.change(addressInput, {target: {value: ""}})
        fireEvent.change(walkIntervalInput, {target: {value: 1900}});
        fireEvent.click(submitButton);
        expect(screen.queryByText("Address or Group is required")).toBeInTheDocument();
        expect(screen.queryByText("Walk Interval number must be an integer greater than or equal 1800")).not.toBeInTheDocument();
    })

    it("Test wrong group name, no port and wrong port", async () => {
        axios.get.mockResolvedValueOnce({data:[]});
        await act( async () => renderModal());
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const addressInput = screen.getByDataTest('sc4snmp:form:group-ip-input').querySelector("input");
        const portInput = screen.getByDataTest("sc4snmp:form:port-input").querySelector("input");

        fireEvent.change(addressInput, {target: {value: "group 1"}})
        fireEvent.change(portInput, {target: {value: ""}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group or host name can consist only of upper and lower english letters, numbers and " +
            "three special characters: '-', '.' and '_'. No spaces are allowed.")).toBeInTheDocument();
        expect(screen.queryByText("Port number must be specified")).toBeInTheDocument();

        fireEvent.change(portInput, {target: {value: "a"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Port number must be an integer in range 1-65535")).toBeInTheDocument();

        fireEvent.change(portInput, {target: {value: "65536"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Port number must be an integer in range 1-65535")).toBeInTheDocument();
    })

    it("Test wrong security engine", async () => {
        axios.get.mockResolvedValueOnce({data:[]});
        await act( async () => renderModal());
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const securityEngineInput = screen.getByDataTest("sc4snmp:form:security-engine-input").querySelector("input")

        fireEvent.change(securityEngineInput, {target: {value: "a"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("If provided, Security Engine can consists only of 10-64 characters in hexadecimal" +
            " notation. All letter must be either upper or lowe case.")).toBeInTheDocument();

        fireEvent.change(securityEngineInput, {target: {value: "aaaabb2313njouoaoa22asd"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("If provided, Security Engine can consists only of 10-64 characters in hexadecimal" +
            " notation. All letter must be either upper or lowe case.")).toBeInTheDocument();
    })

    it("Test no secret in version 3 of snmp", async () => {
        axios.get.mockResolvedValueOnce({data:[]});
        await act( async () => renderModal());
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");

        const versionButton = screen.getByDataTest("sc4snmp:form:select-version")
        fireEvent.click(versionButton)
        await sleep(5)
        const versionOptionButton = screen.getByDataTest("sc4snmp:form:version-3")
        fireEvent.click(versionOptionButton)
        await sleep(5)

        fireEvent.click(submitButton)
        await sleep(5)
        expect(screen.queryByText("When using SNMP version 3, secret must be specified")).toBeInTheDocument()
    })
})
