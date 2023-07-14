import React, {useEffect, useState} from 'react';
import {createDOMID} from '@splunk/ui-utils/id';
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FormRows from "@splunk/react-ui/FormRows";
import {useProfileContext} from "../../store/profile-contxt";
import {validationMessage} from "../../styles/ValidationStyles";
import {useProfilesValidationContxt} from "../../store/profiles-validation-contxt";
import ValidationGroup from "../validation/ValidationGroup";

function FieldPatterns(props){
    const ProfCtx = useProfileContext();
    const ValCtx = useProfilesValidationContxt();
    const [indices, setIndices] = useState({});
    const [reload, setReload] = useState(true);
    const [rowItems, setRowItems] = useState([]);

    const handleRequestRemove = (e, { index }) => {
        const indicesCopy = {...indices};
        let keyToDelete;
        const patternsCopy = ProfCtx.conditionPatterns;
        patternsCopy.splice(index, 1);

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
        const error = ValCtx.conditionPatternsErrors;
        if (error){
            const errorKeys = Object.keys(error);
            errorKeys.forEach((errorID) => {
                if (Number(errorID) === index){delete error[Number(errorID)];}
                if (Number(errorID) > index) {
                    error[Number(errorID)-1] = error[Number(errorID)];
                    delete error[Number(errorID)]
                }
            })
            ValCtx.setConditionPatternsErrors(error);
        }
        setRowItems((prev) => FormRows.removeRow(index, prev));
        setIndices(indicesCopy);
        ProfCtx.setConditionPatterns(patternsCopy);
        setReload((prev)=>{return !prev});
    };

    const handleItemValue = (index, e) => {
        const patternsCopy = ProfCtx.conditionPatterns;
        patternsCopy[index].pattern = e.target.value
        ProfCtx.setConditionPatterns(patternsCopy);
    }

    const handleRequestAdd = () => {
        const indicesCopy = indices;
        const newIndex = rowItems.length;
        const keyID = createDOMID();
        const patternsCopy = ProfCtx.conditionPatterns;
        patternsCopy.push({pattern: ""});
        indicesCopy[`${keyID}`] = newIndex;
        setIndices(indicesCopy);
        ProfCtx.setConditionPatterns(patternsCopy);
        setReload((prev)=>{return !prev});
    };

    const loadFormRows = () => {
        let index = -1;
        const newIndices = {}
        const items = ProfCtx.conditionPatterns.map(value => {
            index += 1;
            const indexCopy = index;
            const keyID = createDOMID();
            newIndices[`${keyID}`] = indexCopy;
            return (
                <FormRows.Row index={indexCopy} key={keyID} onRequestRemove={handleRequestRemove}>
                    <ValidationGroup>
                        <Text defaultValue={value.pattern} onChange={e => handleItemValue(newIndices[`${keyID}`], e)}
                              error={((ValCtx.conditionPatternsErrors && newIndices[`${keyID}`] in ValCtx.conditionPatternsErrors))}/>
                        {((ValCtx.conditionPatternsErrors && newIndices[`${keyID}`] in ValCtx.conditionPatternsErrors) ?
                            ValCtx.conditionPatternsErrors[newIndices[`${keyID}`]].map((el) =>
                                <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                    </ValidationGroup>
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
                addLabel="Add pattern"
            >
                {rowItems}
        </FormRows>
    )
}

export default FieldPatterns;
