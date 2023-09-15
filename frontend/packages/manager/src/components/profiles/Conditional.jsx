import React, {useContext, useEffect, useState} from 'react';
import {createDOMID} from '@splunk/ui-utils/id';
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FormRows from "@splunk/react-ui/FormRows";
import Select from "@splunk/react-ui/Select";
import Card from '@splunk/react-ui/Card';
import {useProfileContext} from "../../store/profile-contxt";
import {validationGroup, validationMessage} from "../../styles/ValidationStyles";
import {useProfilesValidationContxt} from "../../store/profiles-validation-contxt";
import ConditionalIn from "./ConditionalIn";
import Switch from '@splunk/react-ui/Switch';

function Conditional(props){
    const ProfCtx = useProfileContext();
    const ValCtx = useProfilesValidationContxt();
    const [indices, setIndices] = useState({});
    const [reload, setReload] = useState(true);
    const [rowItems, setRowItems] = useState([]);

    const handleRequestRemove = (e, { index }) => {
        const indicesCopy = {...indices};
        let keyToDelete;
        const conditionsCopy = ProfCtx.conditional;
        conditionsCopy.splice(index, 1);

        const indicesKeys = Object.keys(indices)
        indicesKeys.forEach((keyID) => {
             if (indices[`${keyID}`] > index){
                indicesCopy[`${keyID}`] -= 1;
            }
            if (indices[`${keyID}`] === index){
                keyToDelete = keyID;
            }
        })
        delete indicesCopy[`${keyToDelete}`];

        // Update field errors indexes after deleting an element
        const errorField = ValCtx.conditionalFieldErrors;
        if (errorField){
            const errorKeys = Object.keys(errorField);
            errorKeys.forEach((errorID) => {
                if (Number(errorID) === index){delete errorField[Number(errorID)];}
                if (Number(errorID) > index) {
                    errorField[Number(errorID)-1] = errorField[Number(errorID)];
                    delete errorField[Number(errorID)]
                }
            })
            ValCtx.setConditionalFieldErrors(errorField);
        }

        // Update values errors indexes after deleting an element
        const errorValue = ValCtx.conditionalValuesErrors;
        if (errorValue){
            const errorKeys = Object.keys(errorValue);
            errorKeys.forEach((errorID) => {
                if (Number(errorID) === index){delete errorValue[Number(errorID)];}
                if (Number(errorID) > index) {
                    errorValue[Number(errorID)-1] = errorValue[Number(errorID)];
                    delete errorValue[Number(errorID)]
                }
            })
            ValCtx.setConditionalValuesErrors(errorValue);
        }

        setRowItems((prev) => FormRows.removeRow(index, prev));
        setIndices(indicesCopy);
        ProfCtx.setConditionPatterns(conditionsCopy);
        setReload((prev)=>{return !prev});
    };

    const handleField = (index, e) => {
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[index].field = e.target.value
        ProfCtx.setConditional(conditionalCopy);
    }

    const handleOperation = (index, operationValue) => {
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[index].operation = operationValue
        conditionalCopy[index].value = [""]
        ProfCtx.setConditional(conditionalCopy);
        setReload((prev)=>{return !prev});
    }

    const handleValue = (index, e) => {
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[index].value[0] = e.target.value
        ProfCtx.setConditional(conditionalCopy);
    }

    const handleRequestAdd = () => {
        const indicesCopy = indices;
        const newIndex = rowItems.length;
        const keyID = createDOMID();
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy.push({field: "", operation: "equals", value: [""], negateOperation: false});
        indicesCopy[`${keyID}`] = newIndex;
        setIndices(indicesCopy);
        ProfCtx.setConditional(conditionalCopy);
        setReload((prev)=>{return !prev});
    };

    const handleNegation = (index) => {
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[index].negateOperation = !conditionalCopy[index].negateOperation
        ProfCtx.setConditional(conditionalCopy);
        setReload((prev)=>{return !prev});
    }

    const loadFormRows = () => {
        let index = -1;
        const newIndices = {};
        const items = ProfCtx.conditional.map(condition => {
            index += 1;
            const indexCopy = index;
            const keyID = createDOMID();
            newIndices[`${keyID}`] = indexCopy;
            return (
                <FormRows.Row data-test="sc4snmp:form:conditional-row" index={indexCopy} key={keyID} onRequestRemove={handleRequestRemove}>
                    <Card style={{width: "100%"}}>
                        <Card.Body>
                            <div style={validationGroup}>
                                <Text data-test="sc4snmp:form:conditional-field" placeholder="Field" defaultValue={condition.field} onChange={e => handleField(newIndices[`${keyID}`], e)}
                                      error={((ValCtx.conditionalFieldErrors && newIndices[`${keyID}`] in ValCtx.conditionalFieldErrors))}/>
                                {((ValCtx.conditionalFieldErrors && newIndices[`${keyID}`] in ValCtx.conditionalFieldErrors) ?
                                    ValCtx.conditionalFieldErrors[newIndices[`${keyID}`]].map((el) =>
                                        <P data-test="sc4snmp:conditional-field-error" key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                            </div>
                            <div style={validationGroup}>
                                <Select data-test="sc4snmp:form:conditional-select-operation" value={condition.operation} onChange={(e, { value }) =>
                                    handleOperation(newIndices[`${keyID}`], value)} filter>
                                    <Select.Option data-test="sc4snmp:form:conditional-equals" label="equals" value="equals"/>
                                    <Select.Option data-test="sc4snmp:form:conditional-lt" label="less than" value="less than"/>
                                    <Select.Option data-test="sc4snmp:form:conditional-gt" label="greater than" value="greater than"/>
                                    <Select.Option  data-test="sc4snmp:form:conditional-regex" label="regex" value="regex"/>
                                    <Select.Option  data-test="sc4snmp:form:conditional-in" label="in" value="in"/>
                                </Select>
                                <P/>
                            </div>
                            {
                                ProfCtx.conditional[newIndices[`${keyID}`]].operation === 'in' ? (
                                        <div style={validationGroup}>
                                            <ConditionalIn data-test="sc4snmp:form:conditional-condition" newSubmit={props.newSubmit} conditionIndex={newIndices[`${keyID}`]}/>
                                            {((ValCtx.conditionalValuesExistErrors && newIndices[`${keyID}`] in ValCtx.conditionalValuesExistErrors) ?
                                                <P data-test="sc4snmp:conditional-in-error" key={createDOMID()} style={validationMessage}>{ValCtx.conditionalValuesExistErrors[newIndices[`${keyID}`]]}</P>
                                                : null)}
                                        </div>
                                    ) : (
                                    <div style={validationGroup}>
                                        <Text data-test="sc4snmp:form:conditional-condition" placeholder="Value" defaultValue={condition.value[0]} onChange={e => handleValue(newIndices[`${keyID}`], e)}
                                              error={((ValCtx.conditionalValuesErrors && newIndices[`${keyID}`] in ValCtx.conditionalValuesErrors
                                                  && 0 in ValCtx.conditionalValuesErrors[newIndices[`${keyID}`]]))}/>
                                        {((ValCtx.conditionalValuesErrors && newIndices[`${keyID}`] in ValCtx.conditionalValuesErrors
                                                  && 0 in ValCtx.conditionalValuesErrors[newIndices[`${keyID}`]]) ?
                                            ValCtx.conditionalValuesErrors[newIndices[`${keyID}`]][0].map((el) =>
                                                <P data-test="sc4snmp:conditional-condition-error" key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                                    </div>
                                )
                            }
                            <Switch
                                data-test="sc4snmp:conditional-negation"
                                value="statementNegation"
                                onClick={() => handleNegation(newIndices[`${keyID}`])}
                                selected={condition.negateOperation}
                                appearance="toggle"
                            >
                                Statement negation
                            </Switch>
                        </Card.Body>
                    </Card>
                </FormRows.Row>
            );
        });
        setIndices(newIndices);
        return items;
    }

    useEffect(() => {
        let isMounted = true;
        setRowItems(loadFormRows());
        return () => { isMounted = false }
    }, [props.newSubmit, reload]);

    return (
        <FormRows
                onRequestAdd={handleRequestAdd}
                style={{ width: 300 }}
                addLabel="Add condition"
                data-test="sc4snmp:form:add-conditional-profile"
            >
                {rowItems}
        </FormRows>
    )
}

export default Conditional;
