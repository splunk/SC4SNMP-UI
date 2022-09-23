import React, {useState, useRef, useContext} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import InventoryContext from "../../store/inventory-contxt";

function ButtonsModal() {
    const InvCtx = useContext(InventoryContext);
    const modalToggle = useRef(null);

    const handleRequestClose = () => {
        InvCtx.setButtonsOpen(false);
        InvCtx.rowToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleRequestDelete = () => {
       InvCtx.setButtonsOpen(false);
       InvCtx.setDeleteOpen(true);
    };

    const handleRequestEdit = () => {
       InvCtx.setButtonsOpen(false);
       InvCtx.setIsEdit(true);
       InvCtx.setAddOpen(true);
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={InvCtx.buttonsOpen} style={{ width: '600px' }}>
                <Modal.Header title={`Options for device ${InvCtx.address}:${InvCtx.port}`} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <Button appearance="primary" onClick={handleRequestEdit} label="Edit" />
                    <Button appearance="primary" onClick={handleRequestDelete} label="Delete" />
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ButtonsModal;
