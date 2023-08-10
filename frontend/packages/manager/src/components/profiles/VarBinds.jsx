import React, {useEffect, useState} from 'react';
import {createDOMID} from '@splunk/ui-utils/id';
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FormRows from "@splunk/react-ui/FormRows";
import {useProfileContext} from "../../store/profile-contxt";
import {validationMessage} from "../../styles/ValidationStyles";
import {useProfilesValidationContxt} from "../../store/profiles-validation-contxt";
import ValidationGroup from "../validation/ValidationGroup";

function VarBinds(props){
    const ProfCtx = useProfileContext();
    const ValCtx = useProfilesValidationContxt();
    const [indices, setIndices] = useState({});
    const [rowItems, setRowItems] = useState([]);
    const [reload, setReload] = useState(true);

    const handleRequestRemove = (e, { index }) => {
        const indicesCopy = {...indices};
        let keyToDelete;
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy.splice(index, 1);

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
        const error = ValCtx.varBindsErrors;
        if (error){
            const errorKeys = Object.keys(error);
            errorKeys.forEach((errorID) => {
                if (Number(errorID) === index){delete error[Number(errorID)];}
                if (Number(errorID) > index) {
                    error[Number(errorID)-1] = error[Number(errorID)];
                    delete error[Number(errorID)]
                }
            })
            ValCtx.setVarBindsErrors(error);
        }
        setRowItems((prev) => FormRows.removeRow(index, prev));
        setIndices(indicesCopy);
        ProfCtx.setVarBinds(varBindsCopy);
        setReload((prev)=>{return !prev});
    };

    const handleItemValueComponent = (index, e) => {
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy[index].component = e.target.value
        ProfCtx.setVarBinds(varBindsCopy);
    }

    const handleItemValueObject = (index, e) => {
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy[index].object = e.target.value
        ProfCtx.setVarBinds(varBindsCopy);
    }

    const handleItemValueIndex = (index, e) => {
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy[index].index = e.target.value
        ProfCtx.setVarBinds(varBindsCopy);
    }

    const handleRequestAdd = () => {
        const indicesCopy = indices;
        const newIndex = rowItems.length;
        const keyID = createDOMID();
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy.push({component: "", object: "", index: ""});
        indicesCopy[`${keyID}`] = newIndex;
        setIndices(indicesCopy);
        ProfCtx.setVarBinds(varBindsCopy);
        setReload((prev)=>{return !prev});
    };

    const loadFormRows = () => {
        let index = -1;
        const newIndices = {}
        const items = ProfCtx.varBinds.map(value => {
            index += 1;
            const indexCopy = index;
            const keyID = createDOMID();
            newIndices[`${keyID}`] = indexCopy;
            return (
                <FormRows.Row data-test={`sc4snmp:form:varbind-row-${indexCopy}`} index={indexCopy} key={createDOMID()} onRequestRemove={handleRequestRemove}>
                    <ValidationGroup>
                         <div style={{display: 'flex'}}>
                            <Text data-test={`sc4snmp:form:varbind-mib-component-input-${indexCopy}`} defaultValue={value.component} placeholder="MIB component"
                                  onChange={e => handleItemValueComponent(newIndices[`${keyID}`], e)}
                                  error={((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                            <Text data-test={`sc4snmp:form:varbind-mib-object-input-${indexCopy}`} defaultValue={value.object} placeholder="MIB object"
                                  onChange={e => handleItemValueObject(newIndices[`${keyID}`], e)}
                                  error={((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                            <Text data-test={`sc4snmp:form:varbind-mib-index-input-${indexCopy}`} defaultValue={value.index} placeholder="MIB index"
                                  onChange={e => handleItemValueIndex(newIndices[`${keyID}`], e)}
                                  error={((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                        </div>
                        {((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors) ?
                            ValCtx.varBindsErrors[newIndices[`${keyID}`]].map((el,i) => <P data-test={`sc4snmp:varbind-error-${indexCopy}-${i}`} key={createDOMID()}
                                                                                         style={validationMessage}>{el}</P>) :
                            <P/>)}
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
            addLabel="Add varBind"
            data-test="sc4snmp:form:add-varbinds"
        >
            {rowItems}
        </FormRows>
    )

}

export default VarBinds;
