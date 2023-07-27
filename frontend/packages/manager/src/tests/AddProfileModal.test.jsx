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

const sleep = ms => new Promise(r => setTimeout(r, ms));

describe("AddProfileModal", () => {
    it("Test no VarBinds and no profile name", () => {
        renderModal();
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");

        expect(screen.queryByText("Profile Name is required")).not.toBeInTheDocument();
        expect(screen.queryByText("At least one varBind must be specified.")).not.toBeInTheDocument();
        fireEvent.click(submitButton);
        expect(screen.queryByText("Profile Name is required")).toBeInTheDocument();
        expect(screen.queryByText("At least one varBind must be specified.")).toBeInTheDocument();
    })

    it("Test empty VarBind", async () => {
        renderModal();
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const frequencyInput = screen.getByDataTest("sc4snmp:form:frequency-input").querySelector("input")
        const addVarBindButton = screen.getByDataTest("sc4snmp:form:add-varbinds").querySelector(`[data-test="add-row"]`)


        fireEvent.click(addVarBindButton);
        fireEvent.change(frequencyInput, {target: {value: 2}})

        fireEvent.click(submitButton);
        await sleep(5)
        expect(screen.queryByText("MIB-Component is required")).toBeInTheDocument()
    })

    it("Test adding multiple varbinds with errors", async () => {
        renderModal();
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const frequencyInput = screen.getByDataTest("sc4snmp:form:frequency-input").querySelector("input")
        const addVarBindButton = screen.getByDataTest("sc4snmp:form:add-varbinds").querySelector(`[data-test="add-row"]`)


        fireEvent.click(addVarBindButton);
        fireEvent.click(addVarBindButton);
        fireEvent.click(addVarBindButton);
        fireEvent.change(frequencyInput, {target: {value: 2}})
        let mibFamilyInput0 =
            screen.getByDataTest("sc4snmp:form:varbind0-mib-family-input").querySelector("input")
        const mibCategoryInput1 =
            screen.getByDataTest("sc4snmp:form:varbind1-mib-category-input").querySelector("input")
        const mibIndexInput2 =
            screen.getByDataTest("sc4snmp:form:varbind2-mib-index-input").querySelector("input")

        fireEvent.change(mibFamilyInput0, {target: {value: "mi b"}})
        fireEvent.change(mibCategoryInput1, {target: {value: "aa?"}})
        fireEvent.change(mibIndexInput2, {target: {value: "a. a"}})
        fireEvent.click(submitButton);
        await sleep(5)

        let firstRow = screen.getByDataTest("sc4snmp:form:varbind-row-0")
        const secondRow = screen.getByDataTest("sc4snmp:form:varbind-row-1")
        const thirdRow = screen.getByDataTest("sc4snmp:form:varbind-row-2")

        expect(within(firstRow).queryByText("MIB-Component can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.")).toBeInTheDocument()

        expect(within(secondRow).queryByText("MIB-Component is required")).toBeInTheDocument()
        expect(within(secondRow).queryByText("MIB object can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.")).toBeInTheDocument()

        expect(within(thirdRow).queryByText("MIB-Component is required")).toBeInTheDocument()
        expect(within(thirdRow).queryByText("MIB object is required when MIB index is specified")).toBeInTheDocument()
        expect(within(thirdRow).queryByText("Index can't include white spaces")).toBeInTheDocument()

        // Delete first two rows
        await sleep(10)
        let deleteRowButton0 = screen.getByDataTest("sc4snmp:form:varbind-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)
        deleteRowButton0 = screen.getByDataTest("sc4snmp:form:varbind-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)

        firstRow = screen.getByDataTest("sc4snmp:form:varbind-row-0")
        expect(within(firstRow).queryByText("MIB-Component is required")).toBeInTheDocument()
        expect(within(firstRow).queryByText("MIB object is required when MIB index is specified")).toBeInTheDocument()
        expect(within(firstRow).queryByText("Index can't include white spaces")).toBeInTheDocument()

        // Delete remaining row and add the new one
        await sleep(10)
        deleteRowButton0 = screen.getByDataTest("sc4snmp:form:varbind-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)
        fireEvent.click(addVarBindButton);
        await sleep(10);

        mibFamilyInput0 =
            screen.getByDataTest("sc4snmp:form:varbind0-mib-family-input").querySelector("input")

        fireEvent.change(mibFamilyInput0, {target: {value: "mib"}})
        firstRow = screen.getByDataTest("sc4snmp:form:varbind-row-0")
        expect(within(firstRow).queryByText("MIB-Component is required")).not.toBeInTheDocument()
    })

    it ("Test empty field and no patterns in smart profile", () => {
        renderModal({profileType: "smart"})
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");

        expect(screen.queryByText("Field is required")).not.toBeInTheDocument();
        expect(screen.queryByText("At least one pattern must be specified.")).not.toBeInTheDocument();
        fireEvent.click(submitButton);
        expect(screen.queryByText("Field is required")).toBeInTheDocument();
        expect(screen.queryByText("At least one pattern must be specified.")).toBeInTheDocument();
    })

    it("Test wrong field and empty pattern in smart profile", async () => {
        renderModal({profileType: "smart"})
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const addPatternButton = screen.getByDataTest("sc4snmp:form:field-patterns").querySelector(`[data-test="add-row"]`)
        const fieldInput = screen.getByDataTest("sc4snmp:form:condition-field-input").querySelector("input")

        fireEvent.click(addPatternButton);
        fireEvent.click(addPatternButton);
        fireEvent.change(fieldInput, {target: {value: "t est"}});

        let patternInput0 = screen.getByDataTest("sc4snmp:form:field-pattern-0").querySelector("input")
        fireEvent.change(patternInput0, {target: {value: "test"}})
        fireEvent.click(submitButton);
        await sleep(10)

        let firstRow = screen.getByDataTest("sc4snmp:form:field-pattern-row-0")
        const secondRow = screen.getByDataTest("sc4snmp:form:field-pattern-row-1")

        expect(screen.queryByText("Field can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.")).toBeInTheDocument();
        expect(within(firstRow).queryByText("Pattern is required")).not.toBeInTheDocument();
        expect(within(secondRow).queryByText("Pattern is required")).toBeInTheDocument();

        // Delete first row
        await sleep(10)
        let deleteRowButton0 = screen.getByDataTest("sc4snmp:form:field-pattern-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)

        firstRow = screen.getByDataTest("sc4snmp:form:field-pattern-row-0")
        expect(within(firstRow).queryByText("Pattern is required")).toBeInTheDocument();

        // Delete remaining row and add the new one
        await sleep(10)
        deleteRowButton0 = screen.getByDataTest("sc4snmp:form:field-pattern-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)
        fireEvent.click(addPatternButton);
        await sleep(10)
        patternInput0 = screen.getByDataTest("sc4snmp:form:field-pattern-0").querySelector("input")
        fireEvent.change(patternInput0, {target: {value: "test"}})
        fireEvent.click(submitButton);
        await sleep(10)
        expect(within(firstRow).queryByText("Pattern is required")).not.toBeInTheDocument();
    })

    it("Test no conditions", () => {
        renderModal({profileType: "conditional"})
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");

        expect(screen.queryByText("At least one condition must be specified.")).not.toBeInTheDocument();
        fireEvent.click(submitButton);
        expect(screen.queryByText("At least one condition must be specified.")).toBeInTheDocument();
    })

    it("Test errors in multiple conditions", async () => {
        renderModal({profileType: "conditional"})
        const submitButton = screen.getByDataTest("sc4snmp:form:submit-form-button");
        const addConditionalButton = screen.getByDataTest("sc4snmp:form:add-conditional-profile").querySelector(`[data-test="add-row"]`)

        fireEvent.click(addConditionalButton);
        fireEvent.click(addConditionalButton);
        fireEvent.click(addConditionalButton);

        await sleep(5);

        const optionsButton1 = screen.getByDataTest("sc4snmp:form:conditional-select-operation-1")
        fireEvent.click(optionsButton1)
        await sleep(5)
        const inOptionButton1 = screen.getByDataTest("sc4snmp:form:conditional-in-1")
        fireEvent.click(inOptionButton1)
        await sleep(5)

        const fieldInput0 =
            screen.getByDataTest("sc4snmp:form:conditional-field-0").querySelector('[data-test="textbox"]')
        const fieldInput2 =
            screen.getByDataTest("sc4snmp:form:conditional-field-2").querySelector('[data-test="textbox"]')
        const valueInput2 =
            screen.getByDataTest("sc4snmp:form:conditional-condition-2").querySelector('[data-test="textbox"]')

        fireEvent.change(fieldInput0, {target: {value: "te st"}})
        fireEvent.change(fieldInput2, {target: {value: "test"}})
        fireEvent.change(valueInput2, {target: {value: "2"}})

        await sleep(15);

        fireEvent.click(submitButton);
        fireEvent.click(submitButton);

        let firstRow = screen.getByDataTest("sc4snmp:form:conditional-row-0")
        const secondRow = screen.getByDataTest("sc4snmp:form:conditional-row-1")
        const thirdRow = screen.getByDataTest("sc4snmp:form:conditional-row-2")

        expect(within(firstRow).queryByText("Field can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.")).toBeInTheDocument();
        expect(within(firstRow).queryByText("Value is required")).toBeInTheDocument();

        expect(within(secondRow).queryByText("Field is required")).toBeInTheDocument()
        expect(within(secondRow).queryByText("Value is required")).toBeInTheDocument()

        expect(within(thirdRow).queryByText("Field can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.")).not.toBeInTheDocument();
        expect(within(thirdRow).queryByText("Field is required")).not.toBeInTheDocument()
        expect(within(thirdRow).queryByText("Value is required")).not.toBeInTheDocument()

        // Delete first and second row
        await sleep(10)
        let deleteRowButton0 = screen.getByDataTest("sc4snmp:form:conditional-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)
        deleteRowButton0 = screen.getByDataTest("sc4snmp:form:conditional-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)
        deleteRowButton0 = screen.getByDataTest("sc4snmp:form:conditional-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)

        firstRow = screen.getByDataTest("sc4snmp:form:conditional-row-0")
        expect(within(firstRow).queryByText("Field can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.")).not.toBeInTheDocument();
        expect(within(firstRow).queryByText("Field is required")).not.toBeInTheDocument()
        expect(within(firstRow).queryByText("Value is required")).not.toBeInTheDocument()

        // Delete remaining row and add the new one
        await sleep(10)
        deleteRowButton0 = screen.getByDataTest("sc4snmp:form:conditional-row-0").querySelector(`[data-test="remove"]`)
        fireEvent.click(deleteRowButton0)
        await sleep(10)
        fireEvent.click(addConditionalButton);
        await sleep(10);

        const valueInput0 =
            screen.getByDataTest("sc4snmp:form:conditional-condition-0").querySelector('[data-test="textbox"]')
        fireEvent.change(valueInput0, {target: {value: "2"}})

        fireEvent.click(submitButton)
        await sleep(5)

        firstRow = screen.getByDataTest("sc4snmp:form:conditional-row-0")

        expect(within(firstRow).queryByText("Field is required")).toBeInTheDocument()
        expect(within(firstRow).queryByText("Value is required")).not.toBeInTheDocument()
    })
})
