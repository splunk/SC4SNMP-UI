import React, { useCallback, useState, useRef, useContext } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import axios from "axios";
import P from '@splunk/react-ui/Paragraph';
import DeleteProfileContext from "../../store/delete-profile-contxt";

function DeleteProfileModal() {
    const DelProfCtx = useContext(DeleteProfileContext);

    const [cancelButton, setCancelButon] = useState();
    const cancelButtonRef = useCallback((el) => setCancelButon(el), []);

    const handleRequestClose = () => {
        DelProfCtx.setDeleteOpen(false);
    };

    const handleDeleteProfile = () => {
        const profileName = DelProfCtx.profileName;
        console.log(profileName);
        axios.post(`http://127.0.0.1:5000/profiles/delete/${profileName}`)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
        DelProfCtx.setDeleteOpen(false);
    }

    return (
        <div>
            <Modal
                initialFocus={cancelButton}
                onRequestClose={handleRequestClose}
                open={DelProfCtx.deleteOpen}
                style={{ width: '600px' }}
            >
                <Modal.Header title="Header" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <P>Are you sure you want to delete {DelProfCtx.profileName} profile?</P>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" elementRef={cancelButtonRef} onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="secondary" onClick={handleDeleteProfile} label="Delete" />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default DeleteProfileModal;
