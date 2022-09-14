import React, {useState, useRef, useCallback, useContext} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Text from '@splunk/react-ui/Text';
import VarbindsCreator from "./VarbindsCreator";
import Conditions from "./Conditions";
import axios from "axios";
import ProfileContext from "../../store/profile-contxt";


function AddProfileModal(props) {
    const ProfCtx = useContext(ProfileContext);

    const handleProfileName = useCallback((e, { value: val }) => {
        ProfCtx.setProfileName(val);
    }, []);

    const handleFrequency = useCallback((e, { value: val }) => {
        ProfCtx.setFrequency(val);
    }, []);

    const handleVarBinds = (value) => {
        ProfCtx.setVarBinds(value)
        console.log('varbindslol:   ', value);
    }

    const handleConditions = (value) => {
        ProfCtx.setConditions(value)
        console.log('conditionsslol:   ', value);
    }

    const postProfile = (profileObj) => {
        axios.post('http://127.0.0.1:5000/profiles/add', profileObj)
            .then((response) => {
                console.log(response);
        })
    }

    const updateProfile = (profileObj, previousName) => {
        axios.post(`http://127.0.0.1:5000/profiles/update/${previousName}`, profileObj)
            .then((response) => {
                console.log(response);
        })
    }

   const handleRequestClose = useCallback(
    (e) => {
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

        if (ProfCtx.isEdit){
            updateProfile(profileObj, ProfCtx.profileOriginalName);
        }else{
            postProfile(profileObj);
        }

        ProfCtx.setAddOpen(false);
        ProfCtx.addModalToggle?.current?.focus();
        ProfCtx.makeProfilesChange();
        },
        [ProfCtx.frequency, ProfCtx.profileName, ProfCtx.varBinds, ProfCtx.conditions, ProfCtx.setAddOpen,
            ProfCtx.addModalToggle, ProfCtx.makeProfilesChange, ProfCtx.profileOriginalName]
    );

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={ProfCtx.addOpen} style={{ width: '600px' }}>
                <Modal.Header title="Add new profile" onRequestClose={handleRequestClose} />
                <Modal.Body>

                    <ControlGroup label="Profile name">
                        <Text value={ProfCtx.profileName} onChange={handleProfileName}/>
                    </ControlGroup>

                    <ControlGroup label="Frequency of polling" >
                        <Number value={ProfCtx.frequency} onChange={handleFrequency}/>
                    </ControlGroup>

                    <Conditions onConditionsCreator={handleConditions} value={ProfCtx.conditions}/>

                    <ControlGroup label="VarBinds">
                        <VarbindsCreator onVarbindsCreator={handleVarBinds} value={ProfCtx.varBinds}/>
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
