import React, {useState, useRef, useCallback, useContext, useEffect} from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import ProfileContext from "../../store/profile-contxt";
import {StyledControlGroup} from "../../styles/inventory/InventoryStyle";
import Select from "@splunk/react-ui/Select";
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FieldPatterns from "./FieldPatterns";
import {validationGroup, validationMessage} from "../../styles/ValidationStyles";
import ProfilesValidationContxt from "../../store/profiles-validation-contxt";
import Conditional from "./Conditional";

function Condition(props){
    const ProfCtx = useContext(ProfileContext);
    const ValCtx = useContext(ProfilesValidationContxt);

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
            <Select value={ProfCtx.condition} onChange={handleChange} filter>
                <Select.Option label="standard" value="standard"/>
                <Select.Option label="base" value="base"/>
                <Select.Option label="smart" value="smart"/>
                <Select.Option label="walk" value="walk"/>
                <Select.Option label="conditional" value="conditional"/>
            </Select>
            </StyledControlGroup>
            {
                ProfCtx.condition === 'smart' ? (
                    <div>
                        <StyledControlGroup label="Field">
                            <div style={validationGroup}>
                                <Text value={ProfCtx.conditionField} onChange={handleFieldChange} error={((ValCtx.conditionFieldErrors) ? true : false)}/>
                                {((ValCtx.conditionFieldErrors) ? ValCtx.conditionFieldErrors.map((el) =>
                                    <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                            </div>
                        </StyledControlGroup>
                        <StyledControlGroup label="Patterns">
                            <div style={validationGroup}>
                                <FieldPatterns newSubmit={props.newSubmit}/>
                                {((ValCtx.patternsExistErrors) ?
                                <P key={createDOMID()} style={validationMessage}>{ValCtx.patternsExistErrors}</P>
                                : null)}
                            </div>
                        </StyledControlGroup>
                    </div>) : null
            }

            {
                ProfCtx.condition === 'conditional' ? (
                    <StyledControlGroup label="Conditions">
                        <div style={validationGroup}>
                            <Conditional newSubmit={props.newSubmit}/>
                            {((ValCtx.conditionalExistErrors) ?
                            <P key={createDOMID()} style={validationMessage}>{ValCtx.conditionalExistErrors}</P>
                            : null)}
                        </div>
                    </StyledControlGroup>
                ) : null
            }
        </div>
    )
}

export default Condition;