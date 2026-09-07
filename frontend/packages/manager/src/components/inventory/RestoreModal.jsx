import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Message from "@splunk/react-ui/Message";

function RestoreModal(props) {
    const [cancelButton, setCancelButon] = useState();
    const cancelButtonRef = useCallback((el) => setCancelButon(el), []);

    const handleRequestClose = () => {
        props.setOpen(false);
    };

    return (
        <div>
            <Modal
                initialFocus={cancelButton}
                onRequestClose={handleRequestClose}
                open={props.open}
                style={{ width: '600px' }}
            >
                <Modal.Header title="Restore configuration" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <P>
                        Are you sure you want to restore the configuration from the section files on
                        disk?
                    </P>
                    <Message appearance="fill" type="warning">
                        This replaces current Profiles, Groups, and Inventory with the 3
                        configuration files on disk.
                        Hosts no longer present in the files will be
                        removed.
                        Configuration from the values filename will be altered.
                    </Message>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        data-test="sc4snmp:restore-modal:cancel-button"
                        appearance="secondary"
                        elementRef={cancelButtonRef}
                        onClick={handleRequestClose}
                        label="Cancel"
                    />
                    <Button
                        data-test="sc4snmp:restore-modal:confirm-button"
                        appearance="primary"
                        onClick={props.handleRestore}
                        label="Restore"
                    />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

RestoreModal.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleRestore: PropTypes.func.isRequired,
};

export default RestoreModal;
