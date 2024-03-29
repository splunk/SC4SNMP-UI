import React, {useContext, useCallback} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Text from '@splunk/react-ui/Text';
import axios from "axios";
import { createDOMID } from '@splunk/ui-utils/id';
import GroupContext from "../../store/group-contxt";
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import InventoryDevicesValidationContxt from "../../store/inventory-devices-validation-contxt";
import { validationMessage } from "../../styles/ValidationStyles";
import { backendHost } from "../../host";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import ValidationGroup from "../validation/ValidationGroup";

function AddGroupModal() {
    const GrCtx = useContext(GroupContext);
    const ValCtx = useContext(InventoryDevicesValidationContxt);
    const ErrCtx = useContext(ErrorsModalContext);

    const handleGroupNameChange = useCallback((e, { value: val }) => {
        GrCtx.setGroupName(val);
    }, [GrCtx.setGroupName]);

    const postGroup = (groupObj) => {
        axios.post(`http://${backendHost}/groups/add`, groupObj)
            .then((response) => {
                GrCtx.makeGroupsChange();
            })
            .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setErrorType("error");
                ErrCtx.setMessage(error.response.data.message);
            })
    };

    const updateGroup = (groupObj, groupId) => {
        axios.post(`http://${backendHost}/groups/update/${groupId}`, groupObj)
            .then((response) => {
                if ('message' in response.data){
                    ErrCtx.setOpen(true);
                    ErrCtx.setErrorType("info");
                    ErrCtx.setMessage(response.data.message);
                }
                GrCtx.makeGroupsChange();
            })
            .catch((error) => {
                    ErrCtx.setOpen(true);
                    ErrCtx.setErrorType("error");
                    ErrCtx.setMessage(error.response.data.message);
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
                <Modal.Header title={((GrCtx.isGroupEdit) ? `Edit group` : `Add a new group`)} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="Group Name">
                        <ValidationGroup>
                            <Text data-test="sc4snmp:form:group-name-input" value={GrCtx.groupName} onChange={handleGroupNameChange} error={(!!(ValCtx.groupNameErrors))}/>
                            {((ValCtx.groupNameErrors) ? ValCtx.groupNameErrors.map((el) => <P data-test="sc4snmp:group-name-error" key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </ControlGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button data-test="sc4snmp:form:cancel-button" appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button data-test="sc4snmp:form:submit-form-button" appearance="primary" onClick={handleRequestSubmit} label="Submit" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddGroupModal;
