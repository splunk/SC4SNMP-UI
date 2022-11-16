import React, { useState, useRef, useContext } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import ErrorsModalContext from "../store/errors-modal-contxt";

function ErrorsModal() {
    const ErrCtx = useContext(ErrorsModalContext);
    const modalToggle = useRef(null);

    const handleRequestClose = () => {
        ErrCtx.setOpen(false);
        ErrCtx.setMessage("");
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ErrCtx.open} style={{ width: '600px' }}>
                <Modal.Body>
                    <P>{ErrCtx.message}</P>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Close" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ErrorsModal;
