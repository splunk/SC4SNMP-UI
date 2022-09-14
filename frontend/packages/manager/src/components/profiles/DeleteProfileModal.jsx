import React, { useCallback, useState, useRef, useContext } from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import axios from "axios";
import P from '@splunk/react-ui/Paragraph';
import ProfileContext from "../../store/profile-contxt";

function DeleteProfileModal() {
    const ProfCtx = useContext(ProfileContext);

    const [cancelButton, setCancelButon] = useState();
    const cancelButtonRef = useCallback((el) => setCancelButon(el), []);

    const handleRequestClose = () => {
        ProfCtx.setDeleteOpen(false);
        ProfCtx.deleteModalToggle?.current?.focus();
    };

    const handleDeleteProfile = () => {
        const profileName = ProfCtx.profileName;
        console.log(profileName);
        axios.post(`http://127.0.0.1:5000/profiles/delete/${profileName}`)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
        ProfCtx.setDeleteOpen(false);
        ProfCtx.makeProfilesChange();
        ProfCtx.addModalToggle?.current?.focus();
    }

    return (
        <div>
            <Modal
                initialFocus={cancelButton}
                onRequestClose={handleRequestClose}
                open={ProfCtx.deleteOpen}
                style={{ width: '600px' }}
            >
                <Modal.Header title="Header" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <P>Are you sure you want to delete {ProfCtx.profileName} profile?</P>
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
