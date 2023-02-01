import React, { useCallback, useState, useContext } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import ButtonsContext from "../store/buttons-contx";

function DeleteModal(props) {
    const BtnCtx = useContext(ButtonsContext);

    const [cancelButton, setCancelButon] = useState();
    const cancelButtonRef = useCallback((el) => setCancelButon(el), []);

    const handleRequestClose = () => {
        BtnCtx.setDeleteOpen(false);
    };

    return (
        <div>
            <Modal
                initialFocus={cancelButton}
                onRequestClose={handleRequestClose}
                open={BtnCtx.deleteOpen}
                style={{ width: '600px' }}
            >
                <Modal.Header title={`Delete ${props.deleteName}`} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <P>Are you sure you want to delete {props.deleteName} ?</P>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" elementRef={cancelButtonRef} onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="primary" onClick={props.handleDelete} label="Delete" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default DeleteModal;
