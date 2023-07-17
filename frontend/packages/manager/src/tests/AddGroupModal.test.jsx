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


describe("AddGroupModal", () => {
    it("Test wrong group name", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const groupNameInput = screen.getByDataTest('form:group-name-input').querySelector("input");

        fireEvent.change(groupNameInput, {target: {value: "gro?up1"}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group name can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.")).toBeInTheDocument();
    })

    it("Test no group name provided", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const groupNameInput = screen.getByDataTest('form:group-name-input').querySelector("input");

        fireEvent.change(groupNameInput, {target: {value: ""}})
        fireEvent.click(submitButton);
        expect(screen.queryByText("Group name is required")).toBeInTheDocument();
    })
})
