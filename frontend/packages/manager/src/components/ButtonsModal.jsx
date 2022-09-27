import React, {useState, useRef, useContext} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import ButtonsContext from "../store/buttons-contx";

function ButtonsModal(props) {
    const BtnCtx = useContext(ButtonsContext);

    const handleRequestClose = () => {
        BtnCtx.setButtonsOpen(false);
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={props.context.buttonsOpen} style={{ width: '600px' }}>
                <Modal.Header title={`Options for device ${props.context.address}:${props.context.port}`} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <Button appearance="primary" onClick={props.handleRequestEdit} label="Edit" />
                    <Button appearance="primary" onClick={props.handleRequestDelete} label="Delete" />
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ButtonsModal;
