import React, { useState, useRef } from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';

function AddGroupModal() {
    const modalToggle = useRef(null);

    const [open, setOpen] = useState(false);

    const handleRequestOpen = () => {
        setOpen(true);
    };

    const handleRequestClose = () => {
        setOpen(false);
        modalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleRequestSubmit = () => {
        setOpen(false);
        modalToggle?.current?.focus();
    };

    return (
        <div>
            <Button onClick={handleRequestOpen} ref={modalToggle} label="Click me" />
            <Modal onRequestClose={handleRequestClose} open={open} style={{ width: '600px' }}>
                <Modal.Header title="Add a new group" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="Group Name">
                        <Text />
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
