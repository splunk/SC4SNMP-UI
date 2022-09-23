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
import validateProfiles from "./ValidateProfiles";


function AddProfileModal(props) {
    const ProfCtx = useContext(ProfileContext);
    const [profileNameErrors, setProfileNameErrors] = useState(null);
    const [frequencyErrors, setFrequencyErrors] = useState(null);
    const [varBindsErrors, setVarBindsErrors] = useState(null);
    const [conditionFieldErrors, setConditionFieldErrors] = useState(null);
    const [conditionPatternsErrors, setConditionPatternsErrors] = useState(null);
    const [newSubmitPatterns, setNewSubmitPatterns] = useState(false);
    const [newSubmitVarBinds, setNewSubmitVarBinds] = useState(false);

    const newSubmitPatternsHandler = () =>{
        setNewSubmitPatterns(!newSubmitPatterns);
    };

    const newSubmitVarBindsHandler = () =>{
        setNewSubmitVarBinds(!newSubmitVarBinds);
    };

    const resetAllErrors = () =>{
        setProfileNameErrors(null);
        setFrequencyErrors(null);
        setConditionFieldErrors(null);
        setConditionPatternsErrors(null);
        setVarBindsErrors(null);
    };

     const resetErrors = (category) =>{
        switch (category){
            case "profileName":
                setProfileNameErrors(null);
                break;
            case "frequency":
                setFrequencyErrors(null);
                break;
            case "conditionField":
                setConditionFieldErrors(null);
                break;
            case "conditionPatterns":
                setConditionPatternsErrors(null);
                break;
            case "varBinds":
                setVarBindsErrors(null);
                break;
            default:
                break;
        }
    };

    const setErrors = (category, errors) => {
        switch (category){
            case "profileName":
                setProfileNameErrors(errors);
                break;
            case "frequency":
                setFrequencyErrors(errors);
                break;
            case "conditionField":
                setConditionFieldErrors(errors);
                break;
            case "conditionPatterns":
                setConditionPatternsErrors(errors);
                break;
            case "varBinds":
                setVarBindsErrors(errors);
                break;
            default:
                break;
        }
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
        })
    }

    const updateProfile = (profileObj, profileId) => {
        axios.post(`http://127.0.0.1:5000/profiles/update/${profileId}`, profileObj)
            .then((response) => {
                console.log(response);
        })
    }

   const handleRequestClose = useCallback(
    (e) => {
        resetAllErrors();
        ProfCtx.setAddOpen(false);
        ProfCtx.addModalToggle?.current?.focus();
        },
        [ProfCtx.setAddOpen, ProfCtx.addModalToggle]
    );


    const handleApply = useCallback(
    (e) => {
        const validation = validateProfiles(ProfCtx.profileName, ProfCtx.frequency, ProfCtx.conditions,
            ProfCtx.varBinds);

        if (validation[0]){
            // form is valid
            resetAllErrors();
            let profileObj = {
            profileName: ProfCtx.profileName,
            frequency: ProfCtx.frequency,
            varBinds: ProfCtx.varBinds,
            conditions: ProfCtx.conditions
            };
            if (ProfCtx.isEdit){
                updateProfile(profileObj, ProfCtx.profileId);
            }else{
                postProfile(profileObj);
            }
            ProfCtx.setAddOpen(false);
            ProfCtx.addModalToggle?.current?.focus();
            ProfCtx.makeProfilesChange();
        }else{
            // form is invalid
            setNewSubmitPatterns(prevNewSubmitPatterns => {return !prevNewSubmitPatterns;});
            setNewSubmitVarBinds(prevNewSubmitVarBinds => {return !prevNewSubmitVarBinds;});
            const errors = validation[1];
            for (const property in errors) {
                if (errors[property].length > 0 || Object.keys(errors[property]).length > 0){
                    setErrors(property, errors[property]);
                }else {
                    resetErrors(property);
                };
            };
        };

        },
        [ProfCtx.frequency, ProfCtx.profileName, ProfCtx.varBinds, ProfCtx.conditions, ProfCtx.setAddOpen,
            ProfCtx.addModalToggle, ProfCtx.makeProfilesChange, ProfCtx.profileId]
    );


    const validation_group = {
      display: "flex",
      flexDirection: "column"
    };

    const validation_message = {
      color: "red"
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ProfCtx.addOpen} style={{ width: '600px' }}>
                <Modal.Header title={((ProfCtx.isEdit) ? `Edit profile` : "Add a new profile")}
                              onRequestClose={handleRequestClose} />
                <Modal.Body>

                    <ControlGroup label="Profile name">
                        <div style={validation_group}>
                            <Text value={ProfCtx.profileName} onChange={handleProfileName} error={((profileNameErrors) ? true : false)}/>
                            {((profileNameErrors) ? profileNameErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Frequency of polling" >
                        <div style={validation_group}>
                            <Number value={ProfCtx.frequency} onChange={handleFrequency} error={((frequencyErrors) ? true : false)}/>
                            {((frequencyErrors) ? frequencyErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <Conditions onConditionsCreator={handleConditions} value={ProfCtx.conditions} errorField={conditionFieldErrors}
                                errorPatterns={conditionPatternsErrors} setErrorPatterns={setConditionPatternsErrors}
                                validation_message={validation_message} validation_group={validation_group} newSubmit={newSubmitPatterns}/>

                    <ControlGroup label="VarBinds">
                        <VarbindsCreator onVarbindsCreator={handleVarBinds} value={ProfCtx.varBinds} error={varBindsErrors} setError={setVarBindsErrors}
                                         validation_message={validation_message} validation_group={validation_group}
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
