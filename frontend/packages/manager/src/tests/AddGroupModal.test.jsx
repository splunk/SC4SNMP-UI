import React from "react";
import {expect, describe, it} from "@jest/globals";
import {fireEvent} from "@testing-library/dom";
import {render, screen} from "./custom_testing_lib/custom-testing-lib";
import {MockGroupContextProvider} from "./mock_context_providers/MockGroupContextProvider";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import {MockInventoryValidationContextProvider} from "./mock_context_providers/MockInventoryValidationContextProvider";
import AddGroupModal from "../components/groups/AddGroupModal";

function renderModal(){
    return render(
        <MockErrorsContextProvider>
            <MockGroupContextProvider>
                <MockInventoryValidationContextProvider>
                    <AddGroupModal/>
                </MockInventoryValidationContextProvider>
            </MockGroupContextProvider>
        </MockErrorsContextProvider>
    )
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

describe("AddGroupModal", () => {
    it("Test wrong group name", async () => {
        renderModal();
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const groupNameInput = screen.getByDataTest('sc4snmp:form:group-name-input').querySelector("input");

        fireEvent.change(groupNameInput, {target: {value: "gro?up1"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group name can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed. Group name can't start with a number.")).toBeInTheDocument();

        await sleep(5);
        fireEvent.change(groupNameInput, {target: {value: "1group1"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group name can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed. Group name can't start with a number.")).toBeInTheDocument();
    })

    it("Test too long group name", async () => {
        renderModal();
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const groupNameInput = screen.getByDataTest('sc4snmp:form:group-name-input').querySelector("input");

        fireEvent.change(groupNameInput, {target: {value: "group1111111aaaaaaaaaaaa"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group name can have maximum length of 22 characters.")).toBeInTheDocument();
    })

    it("Test no group name provided", () => {
        renderModal();
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const groupNameInput = screen.getByDataTest('sc4snmp:form:group-name-input').querySelector("input");

        fireEvent.change(groupNameInput, {target: {value: ""}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group name is required")).toBeInTheDocument();
    })
})
