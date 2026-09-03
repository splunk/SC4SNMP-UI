import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Message from "@splunk/react-ui/Message";
import ButtonsContext from "../store/buttons-contx";

function DeleteModal(props) {
    const BtnCtx = useContext(ButtonsContext);

    const [cancelButton, setCancelButon] = useState();
    const cancelButtonRef = useCallback((el) => setCancelButon(el), []);
    const returnFocusRef = useRef(null);

    // DeleteModal is shared across Groups/Inventory/Profiles, each with its own per-row
    // delete button, so there is no single fixed trigger element to reference.
    useEffect(() => {
        if (BtnCtx.deleteOpen) {
            returnFocusRef.current = document.activeElement;
        }
    }, [BtnCtx.deleteOpen]);

    const handleRequestClose = () => {
        BtnCtx.setDeleteOpen(false);
    };

    return (
        <div>
            <Modal
                initialFocus={cancelButton}
                onRequestClose={handleRequestClose}
                open={BtnCtx.deleteOpen}
                returnFocus={returnFocusRef}
                style={{ width: '600px' }}
            >
                <Modal.Header title={`Delete ${props.deleteName}`} />
                <Modal.Body>
                    <P>Are you sure you want to delete {props.deleteName} ?</P>
                    {("customWarning" in props && props.customWarning != null) ?
                        (<Message appearance="fill" type="warning">
                            {props.customWarning}
                        </Message>) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button data-test="sc4snmp:delete-modal:cancel-button" appearance="secondary" elementRef={cancelButtonRef} onClick={handleRequestClose} label="Cancel" />
                    <Button data-test="sc4snmp:delete-modal:delete-button" appearance="primary" onClick={props.handleDelete} label="Delete" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

DeleteModal.propTypes = {
    deleteName: PropTypes.string.isRequired,
    customWarning: PropTypes.node,
    handleDelete: PropTypes.func.isRequired,
};

export default DeleteModal;
