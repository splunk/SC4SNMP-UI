import React, {useCallback, useContext, useState} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';
import GroupContext from "../../store/group-contxt";
import axios from "axios";
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import InventoryDevicesValidationContxt from "../../store/inventory-devices-validation-contxt";
import { createDOMID } from '@splunk/ui-utils/id';
import P from '@splunk/react-ui/Paragraph';
import { validationGroup, validationMessage } from "../../styles/ValidationStyles";


function AddDeviceModal(){
    const GrCtx = useContext(GroupContext);
    const ValCtx = useContext(InventoryDevicesValidationContxt);

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
        axios.post('http://127.0.0.1:5000/devices/add', deviceObj)
            .then((response) => {
                GrCtx.setEditedGroupId(GrCtx.groupId);
                GrCtx.makeGroupsChange();
        })
    };

    const updateDevice = (deviceObj, deviceId) => {
        axios.post(`http://127.0.0.1:5000/devices/update/${deviceId}`, deviceObj)
            .then((response) => {
                GrCtx.setEditedGroupId(GrCtx.groupId);
                GrCtx.makeGroupsChange();
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
            onlyAdress: true,
        };
        const validation = validateInventoryAndGroup(deviceObj)
        delete deviceObj.onlyAdress;

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
                <Modal.Header title={((GrCtx.isDeviceEdit) ? `Edit device` : `Add new device to group ${GrCtx.groupName}`)} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="IP address/Group">
                        <div style={validationGroup}>
                            <Text value={GrCtx.address} onChange={handleChangeAddress} error={((ValCtx.addressErrors) ? true : false)}/>
                            {((ValCtx.addressErrors) ? ValCtx.addressErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>
                    <ControlGroup label="Port" >
                        <div style={validationGroup}>
                            <Number value={GrCtx.port} onChange={handleChangePort} error={((ValCtx.portErrors) ? true : false)}/>
                            {((ValCtx.portErrors) ? ValCtx.portErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    help="Clicking the label will focus/activate the Select rather than the default first Text."
                    >
                        <Select defaultValue={GrCtx.version} inputId="customized-select-after" value={GrCtx.version} onChange={handleChangeVersion}>
                            <Select.Option label="1" value="1"/>
                            <Select.Option label="2c" value="2c"/>
                            <Select.Option label="3" value="3"/>
                        </Select>
                    </ControlGroup>

                    <ControlGroup label="Community">
                        <div style={validationGroup}>
                            <Text value={GrCtx.community} onChange={handleChangeCommunity} error={((ValCtx.communityErrors) ? true : false)}/>
                            {((ValCtx.communityErrors) ? ValCtx.communityErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Secret">
                        <div style={validationGroup}>
                            <Text value={GrCtx.secret} onChange={handleChangeSecret} error={((ValCtx.secretErrors) ? true : false)}/>
                            {((ValCtx.secretErrors) ? ValCtx.secretErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Security Engine">
                        <div style={validationGroup}>
                            <Text value={GrCtx.securityEngine} onChange={handleChangeSecurityEngine} error={((ValCtx.securityEngineErrors) ? true : false)}/>
                            {((ValCtx.securityEngineErrors) ? ValCtx.securityEngineErrors.map((el) => <P key={createDOMID()} style={validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>

                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button appearance="primary" label="Submit" onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AddDeviceModal;
