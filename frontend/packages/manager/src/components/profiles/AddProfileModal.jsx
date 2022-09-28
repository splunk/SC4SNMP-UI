import React, {useState, useRef, useCallback, useContext} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Text from '@splunk/react-ui/Text';
import { createDOMID } from '@splunk/ui-utils/id';
import P from '@splunk/react-ui/Paragraph';
import VarbindsCreator from "./VarbindsCreator";
import Conditions from "./Conditions";
import axios from "axios";
import ProfileContext from "../../store/profile-contxt";
import validateProfiles from "../validation/ValidateProfiles";
import ProfilesValidationContxt from "../../store/profiles-validation-contxt";
import { validationGroup, validationMessage } from "../../styles/ValidationStyles";


function AddProfileModal(props) {
    const ProfCtx = useContext(ProfileContext);
    const ValCtx = useContext(ProfilesValidationContxt);
    const [newSubmitPatterns, setNewSubmitPatterns] = useState(false);
    const [newSubmitVarBinds, setNewSubmitVarBinds] = useState(false);

    const newSubmitPatternsHandler = () =>{
        setNewSubmitPatterns(!newSubmitPatterns);
    };

    const newSubmitVarBindsHandler = () =>{
        setNewSubmitVarBinds(!newSubmitVarBinds);
    };


    const handleProfileName = useCallback((e, { value: val }) => {
        ProfCtx.setProfileName(val);
    }, []);

    const handleFrequency = useCallback((e, { value: val }) => {
        ProfCtx.setFrequency(val);
    }, []);

    const handleVarBinds = (value) => {
        ProfCtx.setVarBinds(value);
    }

    const handleConditions = (value) => {
        ProfCtx.setConditions(value);
    }

    const postProfile = (profileObj) => {
        axios.post('http://127.0.0.1:5000/profiles/add', profileObj)
            .then((response) => {
                console.log(response);
                ProfCtx.makeProfilesChange();
        })
    }

    const updateProfile = (profileObj, profileId) => {
        axios.post(`http://127.0.0.1:5000/profiles/update/${profileId}`, profileObj)
            .then((response) => {
                console.log(response);
                ProfCtx.makeProfilesChange();
        })
    }

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

        let profileObj = {
            profileName: ProfCtx.profileName,
            frequency: ProfCtx.frequency,
            varBinds: ProfCtx.varBinds,
            conditions: ProfCtx.conditions
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
            setNewSubmitPatterns(prevNewSubmitPatterns => {return !prevNewSubmitPatterns;});
            setNewSubmitVarBinds(prevNewSubmitVarBinds => {return !prevNewSubmitVarBinds;});
            const errors = validation[1];
            for (const property in errors) {
                if (errors[property].length > 0 || Object.keys(errors[property]).length > 0){
                    ValCtx.setErrors(property, errors[property]);
                }else {
                    ValCtx.resetErrors(property);
                };
            };
        };

        },
        [ProfCtx.frequency, ProfCtx.profileName, ProfCtx.varBinds, ProfCtx.conditions, ProfCtx.setAddOpen,
            ProfCtx.addModalToggle, ProfCtx.makeProfilesChange, ProfCtx.profileId]
    );

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ProfCtx.addOpen} style={{ width: '600px' }}>
                <Modal.Header title={((ProfCtx.isEdit) ? `Edit profile` : "Add a new profile")}
                              onRequestClose={handleRequestClose} />
                <Modal.Body>

                    <ControlGroup label="Profile name">
                        <div style={validationGroup}>
                            <Text value={ProfCtx.profileName} onChange={handleProfileName} error={((ValCtx.profileNameErrors) ? true : false)}/>
                            {((ValCtx.profileNameErrors) ? ValCtx.profileNameErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Frequency of polling" >
                        <div style={validationGroup}>
                            <Number value={ProfCtx.frequency} onChange={handleFrequency} error={((ValCtx.frequencyErrors) ? true : false)}/>
                            {((ValCtx.frequencyErrors) ? ValCtx.frequencyErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <Conditions onConditionsCreator={handleConditions} value={ProfCtx.conditions} errorField={ValCtx.conditionFieldErrors}
                                errorPatterns={ValCtx.conditionPatternsErrors} setErrorPatterns={ValCtx.setConditionPatternsErrors}
                                validationMessage={validationMessage} validationGroup={validationGroup} newSubmit={newSubmitPatterns}/>

                    <ControlGroup label="VarBinds">
                        <VarbindsCreator onVarbindsCreator={handleVarBinds} value={ProfCtx.varBinds} error={ValCtx.varBindsErrors} setError={ValCtx.setVarBindsErrors}
                                         validationMessage={validationMessage} validationGroup={validationGroup}
                        newSubmit={newSubmitVarBinds}/>
                    </ControlGroup>

                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="primary" label="Submit" onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddProfileModal;
