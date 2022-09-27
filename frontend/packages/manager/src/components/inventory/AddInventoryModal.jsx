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
import validateInventoryAndGroup from "../ValidateInventoryAndGroup";
import P from '@splunk/react-ui/Paragraph';
import { createDOMID } from '@splunk/ui-utils/id';
import InventoryDevicesValidationContxt from "../../store/inventory-devices-contxt";


function AddInventoryModal() {

    const [initProfiles, setInitProfiles] = useState([]);

    const InvCtx = useContext(InventoryContext);
    const ValCtx = useContext(InventoryDevicesValidationContxt);

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
        ValCtx.resetAllErrors();
        InvCtx.resetFormData();
        InvCtx.setAddOpen(false);
        InvCtx.addModalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleApply = useCallback(
    (e) => {
        const inventoryObj = {
                address: InvCtx.address,
                port: InvCtx.port,
                version: InvCtx.version,
                community: InvCtx.community,
                secret: InvCtx.secret,
                securityEngine: InvCtx.securityEngine,
                walkInterval: InvCtx.walkInterval,
                profiles: InvCtx.profiles,
                smartProfiles: InvCtx.smartProfiles,
                initProfiles: initProfiles
            }
            console.log("Aplying inventory")
         console.log(inventoryObj)
        const validation = validateInventoryAndGroup(inventoryObj)
        delete inventoryObj.initProfiles;

        if (validation[0]){
            // form is valid
            ValCtx.resetAllErrors();
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
                    ValCtx.setErrors(property, errors[property]);
                }else {
                    ValCtx.resetErrors(property);
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

    const validationGroup = {
      display: "flex",
      flexDirection: "column"
    };

    const validationMessage = {
      color: "red"
    };

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={InvCtx.addOpen} style={{ width: '600px' }}>
                <Modal.Header title={((InvCtx.isEdit) ? `Edit device` : "Add a new device")} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="IP address/Group">
                        <div style={validationGroup}>
                            <Text value={InvCtx.address} onChange={handleChangeAddress}/>
                            {((ValCtx.addressErrors) ? ValCtx.addressErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>
                    <ControlGroup label="Port" >
                        <div style={validationGroup}>
                            <Number value={InvCtx.port} onChange={handleChangePort}/>
                            {((ValCtx.portErrors) ? ValCtx.portErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
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
                        <div style={validationGroup}>
                            <Text value={InvCtx.community} onChange={handleChangeCommunity}/>
                            {((ValCtx.communityErrors) ? ValCtx.communityErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Secret">
                        <div style={validationGroup}>
                            <Text value={InvCtx.secret} onChange={handleChangeSecret}/>
                            {((ValCtx.secretErrors) ? ValCtx.secretErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Security Engine">
                        <div style={validationGroup}>
                            <Text value={InvCtx.securityEngine} onChange={handleChangeSecurityEngine}/>
                            {((ValCtx.securityEngineErrors) ? ValCtx.securityEngineErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Walk Interval">
                        <div style={validationGroup}>
                            <Number value={InvCtx.walkInterval} onChange={handleChangeWalkInterval}/>
                            {((ValCtx.walkIntervalErrors) ? ValCtx.walkIntervalErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Profiles">
                        <div style={validationGroup}>
                            <Multiselect onChange={handleChange} defaultValues={InvCtx.profiles}>
                                {initProfiles.map((v) => (<Multiselect.Option key={createDOMID()} label={v} value={v} />))}
                            </Multiselect>
                            {((ValCtx.profilesErrors) ? ValCtx.profilesErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
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
