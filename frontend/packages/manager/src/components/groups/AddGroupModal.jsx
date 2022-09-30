import React, {useContext, useCallback} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import GroupContext from "../../store/group-contxt";
import axios from "axios";
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import InventoryDevicesValidationContxt from "../../store/inventory-devices-validation-contxt";
import { createDOMID } from '@splunk/ui-utils/id';
import { validationGroup, validationMessage } from "../../styles/ValidationStyles";

function AddGroupModal() {
    const GrCtx = useContext(GroupContext);
    const ValCtx = useContext(InventoryDevicesValidationContxt);

    const handleGroupNameChange = useCallback((e, { value: val }) => {
        GrCtx.setGroupName(val);
    }, [GrCtx.setGroupName]);

    const postGroup = (groupObj) => {
        axios.post('http://127.0.0.1:5000/groups/add', groupObj)
            .then((response) => {
                GrCtx.makeGroupsChange();
        })
    };

    const updateGroup = (groupObj, groupId) => {
        axios.post(`http://127.0.0.1:5000/groups/update/${groupId}`, groupObj)
            .then((response) => {
                GrCtx.makeGroupsChange();
        })
    };

    const handleRequestClose = () => {
        GrCtx.setAddGroupOpen(false);
        ValCtx.resetAllErrors();
        GrCtx.addGroupModalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleRequestSubmit = () => {
        const groupObj = {
                groupName: GrCtx.groupName
            };
        const validation = validateInventoryAndGroup(groupObj)

        if (validation[0]){
            // form is valid
            ValCtx.resetAllErrors();
            if (GrCtx.isGroupEdit){
                updateGroup(groupObj, GrCtx.groupId);
            }else {
                postGroup(groupObj);
            };
            GrCtx.setAddGroupOpen(false);
            GrCtx.addGroupModalToggle?.current?.focus();
        }else{
            // form is invalid
            const errors = validation[1];
            for (const property in errors) {
                if (errors[property].length > 0){
                    ValCtx.setErrors(property, errors[property]);
                }else {
                    ValCtx.resetErrors(property);
                };
            };
        }
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={GrCtx.addGroupOpen} style={{ width: '600px' }}>
                <Modal.Header title="Add a new group" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="Group Name">
                        <div style={validationGroup}>
                            <Text value={GrCtx.groupName} onChange={handleGroupNameChange} error={((ValCtx.groupNameErrors) ? true : false)}/>
                            {((ValCtx.groupNameErrors) ? ValCtx.groupNameErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="primary" onClick={handleRequestSubmit} label="Submit" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddGroupModal;
