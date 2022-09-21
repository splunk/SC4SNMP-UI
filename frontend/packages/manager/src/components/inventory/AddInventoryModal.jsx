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


function AddInventoryModal() {

    const InvCtx = useContext(InventoryContext);

    const handleRequestOpen = () => {
        setOpen(true);
    };

    const handleRequestClose = () => {
        InvCtx.setAddOpen(false);
        InvCtx.addModalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    useEffect(() => {
        let isMounted = true;
        console.log('use effect')
        axios.get('http://127.0.0.1:5000/profiles')
        .then((response) => {
            if (isMounted)
                InvCtx.setInitProfiles(response.data);
        console.log('data: ', response.data);
        })
        return () => { isMounted = false }
    }, [InvCtx.setInitProfiles]);

    const postInventory = (inventoryObj) => {
        axios.post('http://127.0.0.1:5000/inventory/add', inventoryObj)
            .then((response) => {
                console.log(response)
        })
    }

    const handleApply = useCallback(
    (e) => {
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
        console.log(inventoryObj);
        postInventory(inventoryObj);
        InvCtx.setAddOpen(false);
        InvCtx.addModalToggle?.current?.focus();
        InvCtx.makeInventoryChange();
        },
        [InvCtx.address, InvCtx.port, InvCtx.version, InvCtx.community, InvCtx.secret, InvCtx.securityEngine,
            InvCtx.walkInterval, InvCtx.profiles, InvCtx.smartProfiles, InvCtx.setAddOpen, InvCtx.addModalToggle]
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

    const multiselectOptions = InvCtx.initProfiles.map((v) => (
        <Multiselect.Option key={v} label={v} value={v} />
    ));

    const handleChange = (e, { values }) => {
        console.log(values);
        InvCtx.setProfiles(values);
    }

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={InvCtx.addOpen} style={{ width: '600px' }}>
                <Modal.Header title="Add new device for polling" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="IP address">
                        <Text value={InvCtx.address} onChange={handleChangeAddress}/>
                    </ControlGroup>
                    <ControlGroup label="Port" >
                        <Number value={InvCtx.port} onChange={handleChangePort}/>
                    </ControlGroup>

                    <ControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    help="Clicking the label will focus/activate the Select rather than the default first Text."
                    >
                        <Select defaultValue="1" inputId="customized-select-after" value={InvCtx.version} onChange={handleChangeVersion}>
                            <Select.Option label="v1" value="1"/>
                            <Select.Option label="v2c" value="v2c"/>
                            <Select.Option label="v3" value="3"/>
                        </Select>
                    </ControlGroup>

                    <ControlGroup label="community">
                        <Text value={InvCtx.community} onChange={handleChangeCommunity}/>
                    </ControlGroup>


                    <ControlGroup label="Secret">
                        <Text value={InvCtx.secret} onChange={handleChangeSecret}/>
                    </ControlGroup>

                    <ControlGroup label="Security Engine">
                        <Text value={InvCtx.securityEngine} onChange={handleChangeSecurityEngine}/>
                    </ControlGroup>

                    <ControlGroup label="Walk Interval">
                        <Number value={InvCtx.walkInterval} onChange={handleChangeWalkInterval}/>
                    </ControlGroup>

                    <ControlGroup label="Profiles">
                        <Multiselect onChange={handleChange}>
                            {multiselectOptions}
                        </Multiselect>
                    </ControlGroup>

                    <ControlGroup label="Smart Profiles enabled">
                        <RadioBar defaultValue={1} value={InvCtx.smartProfiles} onChange={handleChangeSmartProfiles}>
                            <RadioBar.Option value={1} label="yes"/>
                            <RadioBar.Option value={2} label="no"/>
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