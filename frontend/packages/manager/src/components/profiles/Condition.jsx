import React, {useState, useRef, useCallback, useContext, useEffect} from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import Select from "@splunk/react-ui/Select";
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import {StyledControlGroup} from "../../styles/inventory/InventoryStyle";
import {useProfileContext} from "../../store/profile-contxt";
import FieldPatterns from "./FieldPatterns";
import {validationMessage} from "../../styles/ValidationStyles";
import {useProfilesValidationContxt} from "../../store/profiles-validation-contxt";
import Conditional from "./Conditional";
import ValidationGroup from "../validation/ValidationGroup";

function Condition(props){
    const ProfCtx = useProfileContext();
    const ValCtx = useProfilesValidationContxt();

    const handleFieldChange = useCallback((e, { value: val }) => {
        ProfCtx.setConditionField(val);
    }, []);

    const handleChange = useCallback((e, { value: val }) => {
        ProfCtx.setCondition(val);
    }, []);

    return(
        <div>
            <StyledControlGroup label="Profile type"
                labelFor="customized-select-after">
            <Select data-test="sc4snmp:form:select-condition" value={ProfCtx.condition} onChange={handleChange} filter>
                <Select.Option data-test="sc4snmp:form:condition-standard" label="standard" value="standard"/>
                <Select.Option data-test="sc4snmp:form:condition-base" label="base" value="base"/>
                <Select.Option data-test="sc4snmp:form:condition-smart" label="smart" value="smart"/>
                <Select.Option data-test="sc4snmp:form:condition-walk" label="walk" value="walk"/>
                <Select.Option data-test="sc4snmp:form:condition-conditional" label="conditional" value="conditional"/>
            </Select>
            </StyledControlGroup>
            {
                ProfCtx.condition === 'smart' ? (
                    <div>
                        <StyledControlGroup label="Field">
                            <ValidationGroup>
                                <Text data-test="sc4snmp:form:condition-field-input" value={ProfCtx.conditionField} onChange={handleFieldChange} error={(!!(ValCtx.conditionFieldErrors))}/>
                                {((ValCtx.conditionFieldErrors) ? ValCtx.conditionFieldErrors.map((el) =>
                                    <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                            </ValidationGroup>
                        </StyledControlGroup>
                        <StyledControlGroup label="Patterns">
                            <ValidationGroup>
                                <FieldPatterns newSubmit={props.newSubmit}/>
                                {((ValCtx.patternsExistErrors) ?
                                <P data-test="sc4snmp:patterns-error" key={createDOMID()} style={validationMessage}>{ValCtx.patternsExistErrors}</P>
                                : null)}
                            </ValidationGroup>
                        </StyledControlGroup>
                    </div>) : null
            }

            {
                ProfCtx.condition === 'conditional' ? (
                    <StyledControlGroup label="Conditions">
                        <ValidationGroup>
                            <Conditional newSubmit={props.newSubmit}/>
                            {((ValCtx.conditionalExistErrors) ?
                            <P data-test="sc4snmp:conditional-error" key={createDOMID()} style={validationMessage}>{ValCtx.conditionalExistErrors}</P>
                            : null)}
                        </ValidationGroup>
                    </StyledControlGroup>
                ) : null
            }
        </div>
    )
}

export default Condition;
