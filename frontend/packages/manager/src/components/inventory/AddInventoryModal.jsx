import React, {useRef, useState, Component, useCallback, useEffect, useContext} from 'react';
import { StyledControlGroup, StyledModalBody, StyledModalHeader } from "../../styles/inventory/InventoryStyle";
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import RadioBar from '@splunk/react-ui/RadioBar';
import {useInventoryContext} from "../../store/inventory-contxt";
import axios from "axios";
import Button from '@splunk/react-ui/Button';
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import P from '@splunk/react-ui/Paragraph';
import { createDOMID } from '@splunk/ui-utils/id';
import {useInventoryDevicesValidationContxt} from "../../store/inventory-devices-validation-contxt";
import { validationMessage } from "../../styles/ValidationStyles";
import ValidationGroup from "../validation/ValidationGroup";
import { backendHost } from "../../host";
import {useErrorsModalContext} from "../../store/errors-modal-contxt";


function AddInventoryModal() {
    const [initProfiles, setInitProfiles] = useState([]);
    const InvCtx = useInventoryContext();
    const ValCtx = useInventoryDevicesValidationContxt();
    const ErrCtx = useErrorsModalContext();

    const handleChangeAddress = useCallback((e, { value: val }) => {
        InvCtx.setAddress(val);
    }, [InvCtx]);

    const handleChangePort = useCallback((e, { value: val }) => {
        InvCtx.setPort(val);
    }, [InvCtx]);

    const handleChangeVersion = useCallback((e, { value: val }) => {
        InvCtx.setVersion(val);
    }, [InvCtx]);

    const handleChangeCommunity = useCallback((e, { value: val }) => {
        InvCtx.setCommunity(val);
    }, [InvCtx]);

    const handleChangeSecret = useCallback((e, { value: val }) => {
        InvCtx.setSecret(val);
    }, [InvCtx]);

    const handleChangeSecurityEngine = useCallback((e, { value: val }) => {
        InvCtx.setSecurityEngine(val);
    }, [InvCtx]);

    const handleChangeWalkInterval = useCallback((e, { value: val }) => {
        InvCtx.setWalkInterval(val);
    }, [InvCtx]);

    const handleChangeSmartProfiles = useCallback((e, { value: val }) => {
        InvCtx.setSmartProfiles(val);
    }, [InvCtx]);

    const handleChange = (e, { values }) => {
        InvCtx.setProfiles(values);
    };

    useEffect(() => {
        let isMounted = true;
        axios.get(`http://${backendHost}/profiles/names`)
        .then((response) => {
            if (isMounted) {
                setInitProfiles(response.data);
            }
        })
        return () => { isMounted = false }
    }, []);

    const postInventory = (inventoryObj) => {
        axios.post(`http://${backendHost}/inventory/add`, inventoryObj)
            .then((response) => {
                if (response.data !== "success" && 'message' in response.data){
                    ErrCtx.setOpen(true);
                    ErrCtx.setMessage(response.data.message);
                }
                InvCtx.makeInventoryChange();
            })
            .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
            })
    };

    const updateInventory = (inventoryObj, inventoryId) => {
        axios.post(`http://${backendHost}/inventory/update/${inventoryId}`, inventoryObj)
            .then((response) => {
                console.log(response.data)
                if (response.data !== "success" && 'message' in response.data){
                    ErrCtx.setOpen(true);
                    ErrCtx.setMessage(response.data.message);
                }
                InvCtx.makeInventoryChange();
            })
            .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
            })
    };

    const handleRequestClose = () => {
        ValCtx.resetAllErrors();
        InvCtx.resetFormData();
        InvCtx.setAddOpen(false);
        InvCtx.addModalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    const handleApply = useCallback(
    () => {
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
                <StyledModalHeader title={((InvCtx.isEdit) ? `Edit device/group` : "Add a new device/group")} onRequestClose={handleRequestClose} />
                <StyledModalBody>
                    <StyledControlGroup labelWidth={140} label="IP address/Group">
                        <ValidationGroup>
                            <Text data-test="form:group-ip-input" value={InvCtx.address} onChange={handleChangeAddress} error={((ValCtx.addressErrors) ? true : false)}/>
                            {((ValCtx.addressErrors) ? ValCtx.addressErrors.map((el) => <P data-test="ip-group-error" key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>
                    <StyledControlGroup labelWidth={140} label="Port">
                        <ValidationGroup>
                            <Text data-test="form:port-input" value={InvCtx.port} onChange={handleChangePort} error={((ValCtx.portErrors) ? true : false)}/>
                            {((ValCtx.portErrors) ? ValCtx.portErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    labelWidth={140}
                    >
                        <Select data-test="form:version" defaultValue={InvCtx.version} inputId="customized-select-after" value={InvCtx.version} onChange={handleChangeVersion}>
                            <Select.Option data-test="form:version-1" label="1" value="1"/>
                            <Select.Option data-test="form:version-2c" label="2c" value="2c"/>
                            <Select.Option data-test="form:version-3" label="3" value="3"/>
                        </Select>
                    </StyledControlGroup>

                    <StyledControlGroup label="Community" labelWidth={140}>
                        <ValidationGroup>
                            <Text data-test="form:community-input" value={InvCtx.community} onChange={handleChangeCommunity} error={((ValCtx.communityErrors) ? true : false)}/>
                            {((ValCtx.communityErrors) ? ValCtx.communityErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup label="Secret" labelWidth={140}>
                        <ValidationGroup>
                            <Text value={InvCtx.secret} onChange={handleChangeSecret} error={((ValCtx.secretErrors) ? true : false)}/>
                            {((ValCtx.secretErrors) ? ValCtx.secretErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup label="Security Engine" labelWidth={140}>
                        <ValidationGroup>
                            <Text data-test="form:security-engine-input" value={InvCtx.securityEngine} onChange={handleChangeSecurityEngine} error={((ValCtx.securityEngineErrors) ? true : false)}/>
                            {((ValCtx.securityEngineErrors) ? ValCtx.securityEngineErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup label="Walk Interval (s)" labelWidth={140}>
                        <ValidationGroup>
                            <Number data-test="form:walk-interval-input" value={InvCtx.walkInterval} onChange={handleChangeWalkInterval} error={((ValCtx.walkIntervalErrors) ? true : false)}/>
                            {((ValCtx.walkIntervalErrors) ? ValCtx.walkIntervalErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup label="Profiles" labelWidth={140}>
                        <ValidationGroup>
                            <Multiselect onChange={handleChange} defaultValues={InvCtx.profiles} error={((ValCtx.profilesErrors) ? true : false)}>
                                {initProfiles.map((v) => (<Multiselect.Option key={createDOMID()} label={v} value={v} />))}
                            </Multiselect>
                            {((ValCtx.profilesErrors) ? ValCtx.profilesErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
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
                    <Button data-test="form:submit-form-button" appearance="primary" label="Submit" onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddInventoryModal;
