import React, { useContext } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Message from "@splunk/react-ui/Message";
import ErrorsModalContext from "../store/errors-modal-contxt";

function ErrorsModal() {
    const ErrCtx = useContext(ErrorsModalContext);

    const handleRequestClose = () => {
        ErrCtx.setOpen(false);
        ErrCtx.setErrorType("info");
        ErrCtx.setMessage("");
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ErrCtx.open} style={{ width: '600px' }}>
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
