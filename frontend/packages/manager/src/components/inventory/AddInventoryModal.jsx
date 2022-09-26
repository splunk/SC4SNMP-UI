import React, {useRef, useState, Component, useCallback, useEffect, useContext} from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import RadioBar from '@splunk/react-ui/RadioBar';
import InventoryContext from "../../store/inventory-contxt";
import axios from "axios";
import Button from '@splunk/react-ui/Button';
import validateInventory from "./ValidateInventory";
import P from '@splunk/react-ui/Paragraph';
import { createDOMID } from '@splunk/ui-utils/id';


function AddInventoryModal() {

    const [initProfiles, setInitProfiles] = useState([]);

    const [addressErrors, setAddressErrors] = useState(null);
    const [portErrors, setPortErrors] = useState(null);
    const [communityErrors, setCommunityErrors] = useState(null);
    const [secretErrors, setSecretErrors] = useState(null);
    const [securityEngineErrors, setSecurityEngineErrors] = useState(null);
    const [walkIntervalErrors, setWalkIntervalErrors] = useState(null);
    const [profilesErrors, setProfilesErrors] = useState(null);

    const resetAllErrors = () =>{
        setAddressErrors(null);
        setPortErrors(null);
        setCommunityErrors(null);
        setSecretErrors(null);
        setSecurityEngineErrors(null);
        setWalkIntervalErrors(null);
        setProfilesErrors(null);
    };

    const resetErrors = (category) =>{
        switch (category){
            case "address":
                setAddressErrors(null);
                break;
            case "port":
                setPortErrors(null);
                break;
            case "community":
                setCommunityErrors(null);
                break;
            case "secret":
                setSecretErrors(null);
                break;
            case "securityEngine":
                setSecurityEngineErrors(null);
                break;
            case "walkInterval":
                setWalkIntervalErrors(null);
            case "profiles":
                setProfilesErrors(null);
            default:
                break;
        }
    };

    const setErrors = (category, errors) =>{
        switch (category){
            case "address":
                setAddressErrors(errors);
                break;
            case "port":
                setPortErrors(errors);
                break;
            case "community":
                setCommunityErrors(errors);
                break;
            case "secret":
                setSecretErrors(errors);
                break;
            case "securityEngine":
                setSecurityEngineErrors(errors);
                break;
            case "walkInterval":
                setWalkIntervalErrors(errors);
            case "profiles":
                setProfilesErrors(errors);
            default:
                break;
        }
    };


    const InvCtx = useContext(InventoryContext);


    useEffect(() => {
        let isMounted = true;
        axios.get('http://127.0.0.1:5000/profiles/names')
        .then((response) => {
            if (isMounted)
                setInitProfiles(response.data);
        })
        return () => { isMounted = false }
    }, []);

    const postInventory = (inventoryObj) => {
        axios.post('http://127.0.0.1:5000/inventory/add', inventoryObj)
            .then((response) => {
        })
    }

    const updateInventory = (inventoryObj, inventoryId) => {
        axios.post(`http://127.0.0.1:5000/inventory/update/${inventoryId}`, inventoryObj)
            .then((response) => {
        })
    }

    const handleRequestClose = () => {
        resetAllErrors();
        InvCtx.resetFormData();
        InvCtx.setAddOpen(false);
        InvCtx.addModalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleApply = useCallback(
    (e) => {
        const validation = validateInventory(InvCtx.address, InvCtx.port, InvCtx.version, InvCtx.community,
            InvCtx.secret, InvCtx.securityEngine, InvCtx.walkInterval, InvCtx.profiles, initProfiles)

        if (validation[0]){
            // form is valid
            resetAllErrors();
            let inventoryObj = {
                address: InvCtx.address,
                port: InvCtx.port,
                version: InvCtx.version,
                community: InvCtx.community,
                secret: InvCtx.secret,
                security_engine: InvCtx.securityEngine,
                walk_interval: InvCtx.walkInterval,
                profiles: InvCtx.profiles,
                smart_profiles: InvCtx.smartProfiles,
            }

            if (InvCtx.isEdit){
            updateInventory(inventoryObj, InvCtx.inventoryId)
            }else{
                postInventory(inventoryObj);
            }
            InvCtx.resetFormData();
            InvCtx.setAddOpen(false);
            InvCtx.addModalToggle?.current?.focus();
            InvCtx.makeInventoryChange();
        }else{
            // form is invalid
            const errors = validation[1];
            for (const property in errors) {
                if (errors[property].length > 0){
                    setErrors(property, errors[property]);
                }else {
                    resetErrors(property);
                };
            };
        }

        },
        [InvCtx.address, InvCtx.port, InvCtx.version, InvCtx.community, InvCtx.secret, InvCtx.securityEngine, InvCtx.isEdit,
            InvCtx.walkInterval, InvCtx.profiles, InvCtx.smartProfiles, InvCtx.setAddOpen, InvCtx.addModalToggle, InvCtx.inventoryId, initProfiles]
    );

    const handleChangeAddress = useCallback((e, { value: val }) => {
        InvCtx.setAddress(val);
    }, [InvCtx.setAddress]);

    const handleChangePort = useCallback((e, { value: val }) => {
        InvCtx.setPort(val);
    }, [InvCtx.setPort]);

    const handleChangeVersion = useCallback((e, { value: val }) => {
        InvCtx.setVersion(val);
    }, [InvCtx.setVersion]);

    const handleChangeCommunity = useCallback((e, { value: val }) => {
        InvCtx.setCommunity(val);
    }, [InvCtx.setCommunity]);

    const handleChangeSecret = useCallback((e, { value: val }) => {
        InvCtx.setSecret(val);
    }, [InvCtx.setSecret]);

    const handleChangeSecurityEngine = useCallback((e, { value: val }) => {
        InvCtx.setSecurityEngine(val);
    }, [InvCtx.setSecurityEngine]);

    const handleChangeWalkInterval = useCallback((e, { value: val }) => {
        InvCtx.setWalkInterval(val);
    }, [InvCtx.setWalkInterval]);

    const handleChangeSmartProfiles = useCallback((e, { value: val }) => {
        InvCtx.setSmartProfiles(val);
    }, [InvCtx.setSmartProfiles]);

    const handleChange = (e, { values }) => {
        InvCtx.setProfiles(values);
    }

    const validation_group = {
      display: "flex",
      flexDirection: "column"
    };

    const validation_message = {
      color: "red"
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={InvCtx.addOpen} style={{ width: '600px' }}>
                <Modal.Header title={((InvCtx.isEdit) ? `Edit device` : "Add a new device")} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="IP address/Group">
                        <div style={validation_group}>
                            <Text value={InvCtx.address} onChange={handleChangeAddress}/>
                            {((addressErrors) ? addressErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>
                    <ControlGroup label="Port" >
                        <div style={validation_group}>
                            <Number value={InvCtx.port} onChange={handleChangePort}/>
                            {((portErrors) ? portErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    help="Clicking the label will focus/activate the Select rather than the default first Text."
                    >
                        <Select defaultValue={InvCtx.version} inputId="customized-select-after" value={InvCtx.version} onChange={handleChangeVersion}>
                            <Select.Option label="1" value="1"/>
                            <Select.Option label="2c" value="2c"/>
                            <Select.Option label="3" value="3"/>
                        </Select>
                    </ControlGroup>

                    <ControlGroup label="Community">
                        <div style={validation_group}>
                            <Text value={InvCtx.community} onChange={handleChangeCommunity}/>
                            {((communityErrors) ? communityErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>


                    <ControlGroup label="Secret">
                        <div style={validation_group}>
                            <Text value={InvCtx.secret} onChange={handleChangeSecret}/>
                            {((secretErrors) ? secretErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Security Engine">
                        <div style={validation_group}>
                            <Text value={InvCtx.securityEngine} onChange={handleChangeSecurityEngine}/>
                            {((securityEngineErrors) ? securityEngineErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Walk Interval">
                        <div style={validation_group}>
                            <Number value={InvCtx.walkInterval} onChange={handleChangeWalkInterval}/>
                            {((walkIntervalErrors) ? walkIntervalErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Profiles">
                        <div style={validation_group}>
                            <Multiselect onChange={handleChange} defaultValues={InvCtx.profiles}>
                                {initProfiles.map((v) => (<Multiselect.Option key={createDOMID()} label={v} value={v} />))}
                            </Multiselect>
                            {((profilesErrors) ? profilesErrors.map((el) => <P key={createDOMID()} style={validation_message}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Smart Profiles enabled">
                        <RadioBar value={InvCtx.smartProfiles} onChange={handleChangeSmartProfiles}>
                            <RadioBar.Option value={true} label="true"/>
                            <RadioBar.Option value={false} label="false"/>
                        </RadioBar>
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

export default AddInventoryModal;
