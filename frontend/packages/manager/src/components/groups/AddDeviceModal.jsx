import React, {useCallback, useContext, useState} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';
import GroupContext from "../../store/group-contxt";
import axios from "axios";


function AddDeviceModal(){
    const GrCtx = useContext(GroupContext);

    const handleRequestClose = () => {
        GrCtx.resetDevice();
        GrCtx.setAddDeviceOpen(false);
    }

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
        })
    };

    const updateDevice = (deviceObj, deviceID) => {
        axios.post(`http://127.0.0.1:5000/devices/update/${deviceID}`, deviceObj)
            .then((response) => {
        })
    };

    const handleApply = useCallback(
    (e) => {
            // form is valid
            let deviceObj = {
                address: GrCtx.address,
                port: GrCtx.port,
                version: GrCtx.version,
                community: GrCtx.community,
                secret: GrCtx.secret,
                security_engine: GrCtx.securityEngine,
                group_id: GrCtx.groupID
            }

            if (GrCtx.isDeviceEdit){
                console.log("updating device")
                updateDevice(deviceObj, GrCtx.deviceID)
            }else{
                console.log("posting new device")
                postDevice(deviceObj);
            }

            GrCtx.setEditedGroupID(GrCtx.groupID);
            GrCtx.resetDevice();
            GrCtx.setAddDeviceOpen(false);
            GrCtx.makeGroupsChange();
        },
        [GrCtx.address, GrCtx.port, GrCtx.version, GrCtx.community, GrCtx.secret, GrCtx.securityEngine, GrCtx.isEdit,
            GrCtx.deviceID, GrCtx.setAddDeviceOpen, GrCtx.groupID]
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
            <Modal onRequestClose={handleRequestClose} open={GrCtx.addDeviceOpen} style={{ width: '600px' }}>
                <Modal.Header title={((GrCtx.isDeviceEdit) ? `Edit device` : `Add new device to group ${GrCtx.groupName}`)} onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="IP address/Group">
                        <div style={validation_group}>
                            <Text value={GrCtx.address} onChange={handleChangeAddress}/>
                        </div>
                    </ControlGroup>
                    <ControlGroup label="Port" >
                        <div style={validation_group}>
                            <Number value={GrCtx.port} onChange={handleChangePort}/>
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
                        <div style={validation_group}>
                            <Text value={GrCtx.community} onChange={handleChangeCommunity}/>
                        </div>
                    </ControlGroup>


                    <ControlGroup label="Secret">
                        <div style={validation_group}>
                            <Text value={GrCtx.secret} onChange={handleChangeSecret}/>
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Security Engine">
                        <div style={validation_group}>
                            <Text value={GrCtx.securityEngine} onChange={handleChangeSecurityEngine}/>
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
