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

function AddGroupModal() {
    const GrCtx = useContext(GroupContext);

    const postGroup = (groupObj) => {
        axios.post('http://127.0.0.1:5000/groups/add', groupObj)
            .then((response) => {
        })
    };

    const updateGroup = (groupObj, groupID) => {
        axios.post(`http://127.0.0.1:5000/groups/update/${groupID}`, groupObj)
            .then((response) => {
        })
    };

    const handleRequestClose = () => {
        GrCtx.setAddGroupOpen(false);
        GrCtx.addGroupModalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleRequestSubmit = () => {

        let groupObj = {
                group_name: GrCtx.groupName
            };
        if (GrCtx.isGroupEdit){
            updateGroup(groupObj, GrCtx.groupID);
        }else {
            postGroup(groupObj);
        };
        GrCtx.makeGroupsChange();
        GrCtx.setAddGroupOpen(false);

        GrCtx.addGroupModalToggle?.current?.focus();
    };

    const handleGroupNameChange = useCallback((e, { value: val }) => {
        GrCtx.setGroupName(val);
    }, [GrCtx.setGroupName]);

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={GrCtx.addGroupOpen} style={{ width: '600px' }}>
                <Modal.Header title="Add a new group" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="Group Name">
                        <Text value={GrCtx.groupName} onChange={handleGroupNameChange}/>
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
