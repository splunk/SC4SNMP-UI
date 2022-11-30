import React, {useRef, useState, Component, useCallback, useEffect, useContext} from 'react';
import { StyledControlGroup, StyledModalBody } from "../../styles/inventory/InventoryStyle";
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import RadioBar from '@splunk/react-ui/RadioBar';
import InventoryContext from "../../store/inventory-contxt";
import axios from "axios";
import Button from '@splunk/react-ui/Button';
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import P from '@splunk/react-ui/Paragraph';
import { createDOMID } from '@splunk/ui-utils/id';
import InventoryDevicesValidationContxt from "../../store/inventory-devices-validation-contxt";
import { validationGroup, validationMessage } from "../../styles/ValidationStyles";
import { backendHost } from "../../host";
import ErrorsModalContext from "../../store/errors-modal-contxt";


function AddInventoryModal() {
    const [initProfiles, setInitProfiles] = useState([]);
    const InvCtx = useContext(InventoryContext);
    const ValCtx = useContext(InventoryDevicesValidationContxt);
    const ErrCtx = useContext(ErrorsModalContext);

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
    };

    useEffect(() => {
        let isMounted = true;
        axios.get(`http://${backendHost}/profiles/names`)
        .then((response) => {
            if (isMounted)
                setInitProfiles(response.data);
        })
        return () => { isMounted = false }
    }, []);

    const postInventory = (inventoryObj) => {
        axios.post(`http://${backendHost}/inventory/add`, inventoryObj)
            .then((response) => {
                InvCtx.makeInventoryChange();
            })
            .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
                console.log(error.response.data);
                console.log(error.response.status);
            })
    };

    const updateInventory = (inventoryObj, inventoryId) => {
        axios.post(`http://${backendHost}/inventory/update/${inventoryId}`, inventoryObj)
            .then((response) => {
                InvCtx.makeInventoryChange();
            })
            .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
                console.log(error.response.data);
                console.log(error.response.status);
            })
    };

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

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={InvCtx.addOpen} style={{ width: '700px' }}>
                <Modal.Header title={((InvCtx.isEdit) ? `Edit device` : "Add a new device")} onRequestClose={handleRequestClose} />
                <StyledModalBody>
                    <StyledControlGroup labelWidth={140} label="IP address/Group">
                        <div style={validationGroup}>
                            <Text value={InvCtx.address} onChange={handleChangeAddress} error={((ValCtx.addressErrors) ? true : false)}/>
                            {((ValCtx.addressErrors) ? ValCtx.addressErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>
                    <StyledControlGroup labelWidth={140} label="Port">
                        <div style={validationGroup}>
                            <Text value={InvCtx.port} onChange={handleChangePort} error={((ValCtx.portErrors) ? true : false)}/>
                            {((ValCtx.portErrors) ? ValCtx.portErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>

                    <StyledControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    labelWidth={140}
                    >
                        <Select defaultValue={InvCtx.version} inputId="customized-select-after" value={InvCtx.version} onChange={handleChangeVersion}>
                            <Select.Option label="1" value="1"/>
                            <Select.Option label="2c" value="2c"/>
                            <Select.Option label="3" value="3"/>
                        </Select>
                    </StyledControlGroup>

                    <StyledControlGroup label="Community" labelWidth={140}>
                        <div style={validationGroup}>
                            <Text value={InvCtx.community} onChange={handleChangeCommunity} error={((ValCtx.communityErrors) ? true : false)}/>
                            {((ValCtx.communityErrors) ? ValCtx.communityErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>

                    <StyledControlGroup label="Secret" labelWidth={140}>
                        <div style={validationGroup}>
                            <Text value={InvCtx.secret} onChange={handleChangeSecret} error={((ValCtx.secretErrors) ? true : false)}/>
                            {((ValCtx.secretErrors) ? ValCtx.secretErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>

                    <StyledControlGroup label="Security Engine" labelWidth={140}>
                        <div style={validationGroup}>
                            <Text value={InvCtx.securityEngine} onChange={handleChangeSecurityEngine} error={((ValCtx.securityEngineErrors) ? true : false)}/>
                            {((ValCtx.securityEngineErrors) ? ValCtx.securityEngineErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>

                    <StyledControlGroup label="Walk Interval" labelWidth={140}>
                        <div style={validationGroup}>
                            <Number value={InvCtx.walkInterval} onChange={handleChangeWalkInterval} error={((ValCtx.walkIntervalErrors) ? true : false)}/>
                            {((ValCtx.walkIntervalErrors) ? ValCtx.walkIntervalErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>

                    <StyledControlGroup label="Profiles" labelWidth={140}>
                        <div style={validationGroup}>
                            <Multiselect onChange={handleChange} defaultValues={InvCtx.profiles} error={((ValCtx.profilesErrors) ? true : false)}>
                                {initProfiles.map((v) => (<Multiselect.Option key={createDOMID()} label={v} value={v} />))}
                            </Multiselect>
                            {((ValCtx.profilesErrors) ? ValCtx.profilesErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </StyledControlGroup>

                    <StyledControlGroup label="Smart Profiles enabled" labelWidth={140}>
                        <RadioBar value={InvCtx.smartProfiles} onChange={handleChangeSmartProfiles}>
                            <RadioBar.Option value={true} label="true"/>
                            <RadioBar.Option value={false} label="false"/>
                        </RadioBar>
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

export default AddInventoryModal;
