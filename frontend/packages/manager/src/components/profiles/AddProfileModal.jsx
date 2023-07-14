import React, {useState, useCallback, useContext} from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Text from '@splunk/react-ui/Text';
import { createDOMID } from '@splunk/ui-utils/id';
import P from '@splunk/react-ui/Paragraph';
import VarBinds from "./VarBinds";
import Condition from "./Condition";
import axios from "axios";
import {useProfileContext} from "../../store/profile-contxt";
import validateProfiles from "../validation/ValidateProfiles";
import {useProfilesValidationContxt} from "../../store/profiles-validation-contxt";
import { validationMessage } from "../../styles/ValidationStyles";
import { backendHost } from "../../host";
import {useErrorsModalContext} from "../../store/errors-modal-contxt";
import { StyledControlGroup, StyledModalBody, StyledModalHeader } from "../../styles/inventory/InventoryStyle";
import ValidationGroup from "../validation/ValidationGroup";


function AddProfileModal(props) {
    const ProfCtx = useProfileContext();
    const ValCtx = useProfilesValidationContxt();
    const ErrCtx = useErrorsModalContext();
    const [newSubmit, setNewSubmit] = useState(false);


    const handleProfileName = useCallback((e, { value: val }) => {
        ProfCtx.setProfileName(val);
    }, []);

    const handleFrequency = useCallback((e, { value: val }) => {
        ProfCtx.setFrequency(val);
    }, []);

    const postProfile = (profileObj) => {
        axios.post(`http://${backendHost}/profiles/add`, profileObj)
            .then((response) => {
                console.log(response);
                ProfCtx.makeProfilesChange();
            })
            .catch((error) => {
                console.log(error);
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
            });
    };

    const updateProfile = (profileObj, profileId) => {
        axios.post(`http://${backendHost}/profiles/update/${profileId}`, profileObj)
            .then((response) => {
                ProfCtx.makeProfilesChange();
                if (typeof response.data !== 'string' && 'message' in response.data){
                    console.log(response.data);
                    ErrCtx.setOpen(true);
                    ErrCtx.setMessage(response.data.message);
                }
            })
            .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
            });
    };

   const handleRequestClose = useCallback(
    (e) => {
        ValCtx.resetAllErrors();
        ProfCtx.setAddOpen(false);
        ProfCtx.addModalToggle?.current?.focus();
        },
        [ProfCtx.setAddOpen, ProfCtx.addModalToggle]
    );


    const handleApply = useCallback(
    (e) => {

        const profileObj = {
            profileName: ProfCtx.profileName,
            frequency: ProfCtx.frequency,
            varBinds: ProfCtx.varBinds,
            conditions: {
                condition: ProfCtx.condition,
                field: ProfCtx.conditionField,
                patterns: ProfCtx.conditionPatterns,
                conditions: ProfCtx.conditional
            }
        };

        const validation = validateProfiles(profileObj);

        if (validation[0]){
            // form is valid
            ValCtx.resetAllErrors();
            if (ProfCtx.isEdit){
                updateProfile(profileObj, ProfCtx.profileId);
            }else{
                postProfile(profileObj);
            }
            ProfCtx.setAddOpen(false);
            ProfCtx.addModalToggle?.current?.focus();
        }else{
            // form is invalid
            setNewSubmit(prevNewSubmitPatterns => {return !prevNewSubmitPatterns;});
            const errors = validation[1];
            const errorKeys = Object.keys(errors);
            errorKeys.forEach((errorKey) => {
                if (errors[errorKey].length > 0 || Object.keys(errors[errorKey]).length > 0){
                    ValCtx.setErrors(errorKey, errors[errorKey]);
                }else {
                    ValCtx.resetErrors(errorKey);
                };
            })
        };

        },
        [ProfCtx.frequency, ProfCtx.profileName, ProfCtx.varBinds, ProfCtx.conditions, ProfCtx.setAddOpen,
            ProfCtx.addModalToggle, ProfCtx.makeProfilesChange, ProfCtx.profileId]
    );

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ProfCtx.addOpen} style={{ width: '600px' }}>
                <StyledModalHeader title={((ProfCtx.isEdit) ? `Edit profile` : "Add a new profile")}
                              onRequestClose={handleRequestClose} />
                <StyledModalBody>

                    <StyledControlGroup label="Profile name">
                        <ValidationGroup>
                            <Text value={ProfCtx.profileName} onChange={handleProfileName} error={((ValCtx.profileNameErrors) ? true : false)}/>
                            {((ValCtx.profileNameErrors) ? ValCtx.profileNameErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup label="Frequency of polling (s)" >
                        <ValidationGroup>
                            <Number value={ProfCtx.frequency} onChange={handleFrequency} error={((ValCtx.frequencyErrors) ? true : false)}/>
                            {((ValCtx.frequencyErrors) ? ValCtx.frequencyErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <Condition newSubmit={newSubmit}/>

                    <StyledControlGroup label="VarBinds">
                        <ValidationGroup>
                            <VarBinds newSubmit={newSubmit}/>
                            {((ValCtx.varBindsExistErrors) ?
                            <P key={createDOMID()} style={validationMessage}>{ValCtx.varBindsExistErrors}</P>
                            : null)}
                        </ValidationGroup>
                    </StyledControlGroup>

                </StyledModalBody>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="primary" label="Submit" onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddProfileModal;
