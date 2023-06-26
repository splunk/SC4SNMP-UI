import React, {useContext, useEffect, useState} from 'react';
import {createDOMID} from '@splunk/ui-utils/id';
import Text from "@splunk/react-ui/Text";
import P from "@splunk/react-ui/Paragraph";
import FormRows from "@splunk/react-ui/FormRows";
import ProfileContext from "../../store/profile-contxt";
import {validationGroup, validationMessage} from "../../styles/ValidationStyles";
import ProfilesValidationContxt from "../../store/profiles-validation-contxt";

function VarBinds(props){
    const ProfCtx = useContext(ProfileContext);
    const ValCtx = useContext(ProfilesValidationContxt);
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

    const handleItemValueFamily = (index, e) => {
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy[index].family = e.target.value
        ProfCtx.setVarBinds(varBindsCopy);
    }

    const handleItemValueCategory = (index, e) => {
        const varBindsCopy = ProfCtx.varBinds;
        varBindsCopy[index].category = e.target.value
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
        varBindsCopy.push({family: "", category: "", index: ""});
        indicesCopy[`${keyID}`] = newIndex;
        setRowItems((prev) =>
          FormRows.addRow(
            <FormRows.Row index={newIndex} key={createDOMID()} onRequestRemove={handleRequestRemove}>
                <div style={validationGroup}>
                     <div style={{display: 'flex'}}>
                        <Text defaultValue="" placeholder="Mib family"
                              onChange={e => handleItemValueFamily(indices[`${keyID}`], e)}
                              error={((ValCtx.varBindsErrors && indices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                        <Text defaultValue="" placeholder="Mib category"
                              onChange={e => handleItemValueCategory(indices[`${keyID}`], e)}
                              error={((ValCtx.varBindsErrors && indices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                        <Text defaultValue="" placeholder="Mib index"
                              onChange={e => handleItemValueIndex(indices[`${keyID}`], e)}
                              error={((ValCtx.varBindsErrors && indices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                    </div>
                    {((ValCtx.varBindsErrors && indices[`${keyID}`] in ValCtx.varBindsErrors) ?
                        ValCtx.varBindsErrors[indices[`${keyID}`]].map((el) => <P key={createDOMID()}
                                                                             style={validationMessage}>{el}</P>) :
                        <P/>)}
                </div>
            </FormRows.Row>,
            prev
          )
        );
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
                <FormRows.Row index={indexCopy} key={createDOMID()} onRequestRemove={handleRequestRemove}>
                    <div style={validationGroup}>
                         <div style={{display: 'flex'}}>
                            <Text defaultValue={value.family} placeholder="Mib family"
                                  onChange={e => handleItemValueFamily(newIndices[`${keyID}`], e)}
                                  error={((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                            <Text defaultValue={value.category} placeholder="Mib category"
                                  onChange={e => handleItemValueCategory(newIndices[`${keyID}`], e)}
                                  error={((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                            <Text defaultValue={value.index} placeholder="Mib index"
                                  onChange={e => handleItemValueIndex(newIndices[`${keyID}`], e)}
                                  error={((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors))}/>
                        </div>
                        {((ValCtx.varBindsErrors && newIndices[`${keyID}`] in ValCtx.varBindsErrors) ?
                            ValCtx.varBindsErrors[newIndices[`${keyID}`]].map((el) => <P key={createDOMID()}
                                                                                 style={validationMessage}>{el}</P>) :
                            <P/>)}
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
            style={{ width: 300 }}
            addLabel="Add varBbind"
        >
            {rowItems}
        </FormRows>
    )

}

export default VarBinds;
