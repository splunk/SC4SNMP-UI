import React from "react";
import {expect, describe, it} from '@jest/globals';
import {fireEvent, within} from '@testing-library/dom';
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";
import AddProfileModal from "../components/profiles/AddProfileModal";
import {MockProfileContextProvider} from "./mock_context_providers/MockProfileContextProvider";
import {MockProfileValidationContextProvider} from "./mock_context_providers/MockProfileValidationContextProvider";


function renderModal(profileProps= {}){
    return render(
        <MockErrorsContextProvider>
            <MockProfileContextProvider profileProps={profileProps}>
                <MockProfileValidationContextProvider>
                    <AddProfileModal/>
                </MockProfileValidationContextProvider>
            </MockProfileContextProvider>
        </MockErrorsContextProvider>
    )
}


describe("AddProfileModal", () => {
    it("Test no VarBinds and no profile name", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");

        expect(screen.queryByText("Profile Name is required")).not.toBeInTheDocument();
        expect(screen.queryByText("At least one varBind must be specified.")).not.toBeInTheDocument();
        fireEvent.click(submitButton);
        expect(screen.queryByText("Profile Name is required")).toBeInTheDocument();
        expect(screen.queryByText("At least one varBind must be specified.")).toBeInTheDocument();
    })

    it("Test empty VarBind", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const frequencyInput = screen.getByDataTest("form:frequency-input").querySelector("input")
        const addVarBindButton = screen.getByDataTest("form:add-varbinds").querySelector(`[data-test="add-row"]`)


        fireEvent.click(addVarBindButton);
        fireEvent.change(frequencyInput, {target: {value: 2}})

        fireEvent.click(submitButton);
        fireEvent.click(submitButton);
        expect(screen.queryByText("MIB-Component is required")).toBeInTheDocument()
    })

    it("Test adding multiple varbinds with errors", () => {
        renderModal();
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const frequencyInput = screen.getByDataTest("form:frequency-input").querySelector("input")
        const addVarBindButton = screen.getByDataTest("form:add-varbinds").querySelector(`[data-test="add-row"]`)


        fireEvent.click(addVarBindButton);
        fireEvent.click(addVarBindButton);
        fireEvent.click(addVarBindButton);
        fireEvent.change(frequencyInput, {target: {value: 2}})
        const mibFamilyInput0 =
            screen.getByDataTest("form:varbind0-mib-family-input").querySelector("input")
        const mibCategoryInput1 =
            screen.getByDataTest("form:varbind1-mib-category-input").querySelector("input")
        const mibIndexInput2 =
            screen.getByDataTest("form:varbind2-mib-index-input").querySelector("input")

        fireEvent.change(mibFamilyInput0, {target: {value: "mi b"}})
        fireEvent.change(mibCategoryInput1, {target: {value: "aa?"}})
        fireEvent.change(mibIndexInput2, {target: {value: "a. a"}})
        fireEvent.click(submitButton);
        fireEvent.click(submitButton);

        const firstRow = screen.getByDataTest("form:varbind-row-0")
        const secondRow = screen.getByDataTest("form:varbind-row-1")
        const thirdRow = screen.getByDataTest("form:varbind-row-2")

        expect(within(firstRow).queryByText("MIB-Component can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.")).toBeInTheDocument()

        expect(within(secondRow).queryByText("MIB-Component is required")).toBeInTheDocument()
        expect(within(secondRow).queryByText("MIB object can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.")).toBeInTheDocument()

        expect(within(thirdRow).queryByText("MIB-Component is required")).toBeInTheDocument()
        expect(within(thirdRow).queryByText("MIB object is required when MIB index is specified")).toBeInTheDocument()
        expect(within(thirdRow).queryByText("Index can't include white spaces")).toBeInTheDocument()
    })

    it ("Test empty field and no patterns in smart profile", () => {
        renderModal({profileType: "smart"})
        const submitButton = screen.getByDataTest("form:submit-form-button");

        expect(screen.queryByText("Field is required")).not.toBeInTheDocument();
        expect(screen.queryByText("At least one pattern must be specified.")).not.toBeInTheDocument();
        fireEvent.click(submitButton);
        fireEvent.click(submitButton);
        expect(screen.queryByText("Field is required")).toBeInTheDocument();
        expect(screen.queryByText("At least one pattern must be specified.")).toBeInTheDocument();
    })

    it("Test wrong field and empty pattern in smart profile", () => {
        renderModal({profileType: "smart"})
        const submitButton = screen.getByDataTest("form:submit-form-button");
        const addPatternButton = screen.getByDataTest("form:field-patterns").querySelector(`[data-test="add-row"]`)
        const fieldInput = screen.getByDataTest("form:condition-field-input").querySelector("input")

        fireEvent.click(addPatternButton);
        fireEvent.change(fieldInput, {target: {value: "t est"}});
        fireEvent.click(submitButton);
        fireEvent.click(submitButton);

        expect(screen.queryByText("Field can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.")).toBeInTheDocument();
        expect(screen.queryByText("Pattern is required")).toBeInTheDocument();
    })
})
