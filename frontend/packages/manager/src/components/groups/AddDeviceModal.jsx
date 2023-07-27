import React, {useCallback, useContext, useState} from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';
import GroupContext from "../../store/group-contxt";
import axios from "axios";
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import InventoryDevicesValidationContxt from "../../store/inventory-devices-validation-contxt";
import { createDOMID } from '@splunk/ui-utils/id';
import P from '@splunk/react-ui/Paragraph';
import { validationMessage } from "../../styles/ValidationStyles";
import { backendHost } from "../../host";
import { StyledControlGroup, StyledModalBody, StyledModalHeader } from "../../styles/inventory/InventoryStyle";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import ValidationGroup from "../validation/ValidationGroup";


function AddDeviceModal(){
    const GrCtx = useContext(GroupContext);
    const ValCtx = useContext(InventoryDevicesValidationContxt);
    const ErrCtx = useContext(ErrorsModalContext);

    const handleChangeAddress = useCallback((e, { value: val }) => {
        GrCtx.setAddress(val);
    }, [GrCtx.setAddress]);

    const handleChangePort = useCallback((e, { value: val }) => {
        GrCtx.setPort(val);
    }, [GrCtx.setPort]);

    const handleChangeVersion = useCallback((e, { value: val }) => {
        GrCtx.setVersion(val);
    }, [GrCtx.setVersion]);

    const handleChangeCommunity = useCallback((e, { value: val }) => {
        GrCtx.setCommunity(val);
    }, [GrCtx.setCommunity]);

    const handleChangeSecret = useCallback((e, { value: val }) => {
        GrCtx.setSecret(val);
    }, [GrCtx.setSecret]);

    const handleChangeSecurityEngine = useCallback((e, { value: val }) => {
        GrCtx.setSecurityEngine(val);
    }, [GrCtx.setSecurityEngine]);

    const postDevice = (deviceObj) => {
        axios.post(`http://${backendHost}/devices/add`, deviceObj)
            .then((response) => {
                GrCtx.setEditedGroupId(GrCtx.groupId);
                GrCtx.makeGroupsChange();
        })
        .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
            })
    };

    const updateDevice = (deviceObj, deviceId) => {
        axios.post(`http://${backendHost}/devices/update/${deviceId}`, deviceObj)
            .then((response) => {
                GrCtx.setEditedGroupId(GrCtx.groupId);
                GrCtx.makeGroupsChange();
        })
        .catch((error) => {
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(error.response.data.message);
            })
    };

    const handleRequestClose = () => {
        ValCtx.resetAllErrors();
        GrCtx.resetDevice();
        GrCtx.setAddDeviceOpen(false);
    }

    const handleApply = useCallback((e) => {
        const deviceObj = {
            address: GrCtx.address,
            port: GrCtx.port,
            version: GrCtx.version,
            community: GrCtx.community,
            secret: GrCtx.secret,
            securityEngine: GrCtx.securityEngine,
            groupId: GrCtx.groupId,
            inGroupConfig: true,
        };
        const validation = validateInventoryAndGroup(deviceObj)
        delete deviceObj.inGroupConfig;

        if (validation[0]){
            // form is valid
            ValCtx.resetAllErrors();
            if (GrCtx.isDeviceEdit){
                updateDevice(deviceObj, GrCtx.deviceId)
            }else{
                postDevice(deviceObj);
            }
            GrCtx.resetDevice();
            GrCtx.setAddDeviceOpen(false);
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
        };
        },
        [GrCtx.address, GrCtx.port, GrCtx.version, GrCtx.community, GrCtx.secret, GrCtx.securityEngine, GrCtx.isEdit,
            GrCtx.deviceId, GrCtx.setAddDeviceOpen, GrCtx.groupId]
    );

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={GrCtx.addDeviceOpen} style={{ width: '600px' }}>
                <StyledModalHeader title={((GrCtx.isDeviceEdit) ? `Edit device` : `Add new device to group ${GrCtx.groupName}`)} onRequestClose={handleRequestClose} />
                <StyledModalBody>
                    <StyledControlGroup labelWidth={140} label="IP address">
                        <ValidationGroup>
                            <Text data-test='sc4snmp:form:ip-input' value={GrCtx.address} onChange={handleChangeAddress} error={((ValCtx.addressErrors) ? true : false)}/>
                            {((ValCtx.addressErrors) ? ValCtx.addressErrors.map((el, i) => <P data-test={`sc4snmp:ip-error-${i}`} key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>
                    <StyledControlGroup labelWidth={140} label="Port" >
                        <ValidationGroup>
                            <Text data-test="sc4snmp:form:port-input" value={GrCtx.port} onChange={handleChangePort} error={((ValCtx.portErrors) ? true : false)}/>
                            {((ValCtx.portErrors) ? ValCtx.portErrors.map((el, i) => <P data-test={`sc4snmp:port-error-${i}`} key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    labelWidth={140}
                    >
                        <Select data-test="sc4snmp:form:select-version" defaultValue={GrCtx.version} inputId="customized-select-after" value={GrCtx.version} onChange={handleChangeVersion}>
                            <Select.Option data-test="sc4snmp:form:version-from-inventory" label="From inventory" value=""/>
                            <Select.Option data-test="sc4snmp:form:version-1" label="1" value="1"/>
                            <Select.Option data-test="sc4snmp:form:version-2c" label="2c" value="2c"/>
                            <Select.Option data-test="sc4snmp:form:version-3" label="3" value="3"/>
                        </Select>
                    </StyledControlGroup>

                    <StyledControlGroup labelWidth={140} label="Community">
                        <ValidationGroup>
                            <Text data-test="sc4snmp:form:community-input" value={GrCtx.community} onChange={handleChangeCommunity} error={((ValCtx.communityErrors) ? true : false)}/>
                            {((ValCtx.communityErrors) ? ValCtx.communityErrors.map((el, i) => <P data-test={`sc4snmp:community-error-${i}`} key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup labelWidth={140} label="Secret">
                        <ValidationGroup>
                            <Text data-test="sc4snmp:form:secret-input" value={GrCtx.secret} onChange={handleChangeSecret} error={((ValCtx.secretErrors) ? true : false)}/>
                            {((ValCtx.secretErrors) ? ValCtx.secretErrors.map((el, i) => <P data-test={`sc4snmp:secret-error-${i}`} key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                    <StyledControlGroup labelWidth={140} label="Security Engine">
                        <ValidationGroup>
                            <Text data-test="sc4snmp:form:security-engine-input" value={GrCtx.securityEngine} onChange={handleChangeSecurityEngine} error={((ValCtx.securityEngineErrors) ? true : false)}/>
                            {((ValCtx.securityEngineErrors) ? ValCtx.securityEngineErrors.map((el, i) => <P data-test={`sc4snmp:security-engine-error-${i}`} key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </ValidationGroup>
                    </StyledControlGroup>

                </StyledModalBody>
                <Modal.Footer>
                    <Button data-test="sc4snmp:form:cancel-button" appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button data-test="sc4snmp:form:submit-form-button" appearance="primary" label="Submit" onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AddDeviceModal;
