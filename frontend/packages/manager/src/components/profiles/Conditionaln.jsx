import React, {useContext, useEffect, useState} from 'react';
import {createDOMID} from '@splunk/ui-utils/id';
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FormRows from "@splunk/react-ui/FormRows";
import ProfileContext from "../../store/profile-contxt";
import {validationGroup, validationMessage} from "../../styles/ValidationStyles";
import ProfilesValidationContxt from "../../store/profiles-validation-contxt";

function ConditionalIn(props){
    const ProfCtx = useContext(ProfileContext);
    const ValCtx = useContext(ProfilesValidationContxt);
    const [indices, setIndices] = useState({});
    const [reload, setReload] = useState(true);
    const [rowItems, setRowItems] = useState([]);

    const handleRequestRemove = (e, { index }) => {
        const indicesCopy = {...indices};
        let keyToDelete;
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[props.conditionIndex].value.splice(index, 1);

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

        // Update errors indexes after deleting an element
        const errors = ValCtx.conditionalValuesErrors;
        if (errors && errors.hasOwnProperty(props.conditionIndex)){
            const error = errors[props.conditionIndex]
            const errorKeys = Object.keys(error);
            errorKeys.forEach((errorID) => {
                if (Number(errorID) === index){delete error[Number(errorID)];}
                if (Number(errorID) > index) {
                    error[Number(errorID)-1] = error[Number(errorID)];
                    delete error[Number(errorID)]
                }
            })
            errors[props.conditionIndex] = error
            ValCtx.setConditionalValuesErrors(errors);
        }
        setRowItems((prev) => FormRows.removeRow(index, prev));
        setIndices(indicesCopy);
        ProfCtx.setConditional(conditionalCopy);
        setReload((prev)=>{return !prev});
    };

    const handleItemValue = (index, e) => {
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[props.conditionIndex].value[index] = e.target.value
        ProfCtx.setConditional(conditionalCopy);
    }

    const handleRequestAdd = () => {
        const indicesCopy = indices;
        const newIndex = rowItems.length;
        const keyID = createDOMID();
        const conditionalCopy = ProfCtx.conditional;
        conditionalCopy[props.conditionIndex].value.push("");
        indicesCopy[`${keyID}`] = newIndex;
        setIndices(indicesCopy);
        ProfCtx.setConditionPatterns(conditionalCopy);
        setReload((prev)=>{return !prev});
    };

    const loadFormRows = () => {
        let index = -1;
        const newIndices = {}
        const items = ProfCtx.conditional[props.conditionIndex].value.map(value => {
            index += 1;
            const indexCopy = index;
            const keyID = createDOMID();
            newIndices[`${keyID}`] = indexCopy;
            return (
                <FormRows.Row index={indexCopy} key={keyID} onRequestRemove={handleRequestRemove}>
                    <div style={validationGroup}>
                        <Text defaultValue={value} onChange={e => handleItemValue(newIndices[`${keyID}`], e)}
                              error={((ValCtx.conditionalValuesErrors && props.conditionIndex in ValCtx.conditionalValuesErrors)) &&
                        newIndices[`${keyID}`] in ValCtx.conditionalValuesErrors[props.conditionIndex]}/>
                        {((ValCtx.conditionalValuesErrors && props.conditionIndex in ValCtx.conditionalValuesErrors
                         && newIndices[`${keyID}`] in ValCtx.conditionalValuesErrors[props.conditionIndex]) ?
                                    ValCtx.conditionalValuesErrors[props.conditionIndex][newIndices[`${keyID}`]].map((el) =>
                                        <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                    </div>
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
                style={{ width: "100%" }}
                addLabel="Add value"
            >
                {rowItems}
        </FormRows>
    )
}

export default ConditionalIn;
