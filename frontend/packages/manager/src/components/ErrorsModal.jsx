import React, { useContext, useEffect, useRef } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Message from "@splunk/react-ui/Message";
import ErrorsModalContext from "../store/errors-modal-contxt";

function ErrorsModal() {
    const ErrCtx = useContext(ErrorsModalContext);
    const returnFocusRef = useRef(null);

    // ErrorsModal is opened from many unrelated call sites across the app, so there is no
    // single fixed trigger element - capture whatever had focus right before it opened.
    useEffect(() => {
        if (ErrCtx.open) {
            returnFocusRef.current = document.activeElement;
        }
    }, [ErrCtx.open]);

    const handleRequestClose = () => {
        ErrCtx.setOpen(false);
        ErrCtx.setErrorType("info");
        ErrCtx.setMessage("");
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ErrCtx.open} returnFocus={returnFocusRef} style={{ width: '600px' }}>
                <Modal.Body>
                    {
                        ErrCtx.errorType === "info" ? <P>{ErrCtx.message}</P> : null
                    }
                    {
                        ErrCtx.errorType === "warning" ?
                            <Message appearance="fill" type="warning">
                                {ErrCtx.message}
                            </Message> : null
                    }
                    {
                        ErrCtx.errorType === "error" ?
                            <Message appearance="fill" type="error">
                                {ErrCtx.message}
                            </Message> : null
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button data-test="sc4snmp:errors-modal:cancel-button" appearance="secondary" onClick={handleRequestClose} label="Close" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ErrorsModal;
