import React, {useContext, useEffect, useState} from 'react';
import {createDOMID} from '@splunk/ui-utils/id';
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FormRows from "@splunk/react-ui/FormRows";
import {useProfileContext} from "../../store/profile-contxt";
import {validationGroup, validationMessage} from "../../styles/ValidationStyles";
import {useProfilesValidationContxt} from "../../store/profiles-validation-contxt";
import Select from "@splunk/react-ui/Select";
import Card from '@splunk/react-ui/Card';
import ConditionalIn from "./Conditionaln";

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
        conditionalCopy.push({field: "", operation: "equals", value: [""]});
        indicesCopy[`${keyID}`] = newIndex;
        setIndices(indicesCopy);
        ProfCtx.setConditional(conditionalCopy);
        setReload((prev)=>{return !prev});
    };

    const loadFormRows = () => {
        let index = -1;
        const newIndices = {};
        const items = ProfCtx.conditional.map(condition => {
            index += 1;
            const indexCopy = index;
            const keyID = createDOMID();
            newIndices[`${keyID}`] = indexCopy;
            return (
                <FormRows.Row data-test={`form:conditional-row-${indexCopy}`} index={indexCopy} key={keyID} onRequestRemove={handleRequestRemove}>
                    <Card style={{width: "100%"}}>
                        <Card.Body>
                            <div style={validationGroup}>
                                <Text data-test={`form:conditional-field-${indexCopy}`} placeholder="Field" defaultValue={condition.field} onChange={e => handleField(newIndices[`${keyID}`], e)}
                                      error={((ValCtx.conditionalFieldErrors && newIndices[`${keyID}`] in ValCtx.conditionalFieldErrors))}/>
                                {((ValCtx.conditionalFieldErrors && newIndices[`${keyID}`] in ValCtx.conditionalFieldErrors) ?
                                    ValCtx.conditionalFieldErrors[newIndices[`${keyID}`]].map((el) =>
                                        <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                            </div>
                            <div style={validationGroup}>
                                <Select data-test={`form:conditional-select-operation-${indexCopy}`} value={condition.operation} onChange={(e, { value }) =>
                                    handleOperation(newIndices[`${keyID}`], value)} filter>
                                    <Select.Option data-test={`form:conditional-equals-${indexCopy}`} label="equals" value="equals"/>
                                    <Select.Option data-test={`form:conditional-lt-${indexCopy}`} label="less than" value="less than"/>
                                    <Select.Option data-test={`form:conditional-gt-${indexCopy}`} label="greater than" value="greater than"/>
                                    <Select.Option  data-test={`form:conditional-in-${indexCopy}`}label="in" value="in"/>
                                </Select>
                                <P/>
                            </div>
                            {
                                ProfCtx.conditional[newIndices[`${keyID}`]].operation === 'in' ? (
                                        <div style={validationGroup}>
                                            <ConditionalIn data-test={`form:conditional-condition-${indexCopy}`} newSubmit={props.newSubmit} conditionIndex={newIndices[`${keyID}`]}/>
                                            {((ValCtx.conditionalValuesExistErrors && newIndices[`${keyID}`] in ValCtx.conditionalValuesExistErrors) ?
                                                <P key={createDOMID()} style={validationMessage}>{ValCtx.conditionalValuesExistErrors[newIndices[`${keyID}`]]}</P>
                                                : null)}
                                        </div>
                                    ) : (
                                    <div style={validationGroup}>
                                        <Text data-test={`form:conditional-condition-${indexCopy}`} placeholder="Value" defaultValue={condition.value[0]} onChange={e => handleValue(newIndices[`${keyID}`], e)}
                                              error={((ValCtx.conditionalValuesErrors && newIndices[`${keyID}`] in ValCtx.conditionalValuesErrors
                                                  && 0 in ValCtx.conditionalValuesErrors[newIndices[`${keyID}`]]))}/>
                                        {((ValCtx.conditionalValuesErrors && newIndices[`${keyID}`] in ValCtx.conditionalValuesErrors
                                                  && 0 in ValCtx.conditionalValuesErrors[newIndices[`${keyID}`]]) ?
                                            ValCtx.conditionalValuesErrors[newIndices[`${keyID}`]][0].map((el) =>
                                                <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                                    </div>
                                )
                            }
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
                data-test="form:conditional-profile"
            >
                {rowItems}
        </FormRows>
    )
}

export default Conditional;
