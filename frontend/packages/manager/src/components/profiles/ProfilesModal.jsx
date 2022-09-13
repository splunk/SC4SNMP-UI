import React, {useState, useRef, useCallback} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Text from '@splunk/react-ui/Text';
import VarbindsCreator from "../VarbindsCreator";
import Conditions from "../Conditions";
import PatternsCreator from "../PatternsCreator";
import axios from "axios";


function ProfilesModal() {

    const modalToggle = useRef(null);
    const [open, setOpen] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [frequency, setFrequency] = useState(1);
    const [varBinds, setVarBinds] = useState(null);
    const [conditions, setConditions] = useState(null);

    const varBindsRef = useRef(null);

    const handleRequestOpen = () => {
        setOpen(true);
    };

    const handleProfileName = useCallback((e, { value: val }) => {
        setProfileName(val);
    }, []);

    const handleFrequency = useCallback((e, { value: val }) => {
        setFrequency(val);
    }, []);

    const handleRequestClose = () => {
        setOpen(false);
        modalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleVarBinds = (value) => {
        setVarBinds(value)
        console.log('varbindslol:   ', value);
    }

    const handleConditions = (value) => {
        setConditions(value)
        console.log('conditionsslol:   ', value);
    }

    const postProfile = (profileObj) => {
        axios.post('http://127.0.0.1:5000/profiles/add', profileObj)
            .then((response) => {
                console.log(response)
        })
    }

    const handleApply = useCallback(
    (e) => {
        var profileObj = {
            profileName: profileName,
            frequency: frequency,
            varBinds: varBinds,
            conditions: conditions
        }
        postProfile(profileObj)
        setOpen(false);
        modalToggle?.current?.focus();},
        [frequency, profileName, varBinds, conditions, setOpen, modalToggle]
    );

    return (
        <div>
            <Button onClick={handleRequestOpen} ref={modalToggle} label="Add new profile" />
            <Modal onRequestClose={handleRequestClose} open={open} style={{ width: '600px' }}>
                <Modal.Header title="Add new profile" onRequestClose={handleRequestClose} />
                <Modal.Body>

                    <ControlGroup label="Profile name">
                        <Text value={profileName} onChange={handleProfileName}/>
                    </ControlGroup>

                    <ControlGroup label="Frequency of polling" >
                        <Number value={frequency} onChange={handleFrequency}/>
                    </ControlGroup>

                    <Conditions onConditionsCreator={handleConditions}/>

                    <ControlGroup label="VarBinds">
                        <VarbindsCreator onVarbindsCreator={handleVarBinds}/>
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

export default ProfilesModal;
