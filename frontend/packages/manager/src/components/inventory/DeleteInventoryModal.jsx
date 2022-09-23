import React, { useCallback, useState, useRef, useContext } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import axios from "axios";
import P from '@splunk/react-ui/Paragraph';
import InventoryContext from "../../store/inventory-contxt";

function DeleteInventoryModal() {
    const InvCtx = useContext(InventoryContext);

    const [cancelButton, setCancelButon] = useState();
    const cancelButtonRef = useCallback((el) => setCancelButon(el), []);

    const handleRequestClose = () => {
        InvCtx.setDeleteOpen(false);
        InvCtx.resetFormData();
        InvCtx.deleteModalToggle?.current?.focus();
    };

    const handleDeleteProfile = () => {
        axios.post(`http://127.0.0.1:5000/inventory/delete/${InvCtx.inventoryId}`)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
        InvCtx.setDeleteOpen(false);
        InvCtx.resetFormData();
        InvCtx.makeInventoryChange();
        InvCtx.addModalToggle?.current?.focus();
    }

    return (
        <div>
            <Modal
                initialFocus={cancelButton}
                onRequestClose={handleRequestClose}
                open={InvCtx.deleteOpen}
                style={{ width: '600px' }}
            >
                <Modal.Header title={`Delete ${InvCtx.address}:${InvCtx.port}`} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <P>Are you sure you want to delete inventory for device {InvCtx.address}:{InvCtx.port}?</P>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" elementRef={cancelButtonRef} onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="secondary" onClick={handleDeleteProfile} label="Delete" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default DeleteInventoryModal;
