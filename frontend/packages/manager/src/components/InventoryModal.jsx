import React, {useRef, useState, Component, useCallback, useEffect} from 'react';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Number from '@splunk/react-ui/Number';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Text from '@splunk/react-ui/Text';
import RadioBar from '@splunk/react-ui/RadioBar';
import axios from "axios";


function InventoryModal() {
    const modalToggle = useRef(null);

    const [open, setOpen] = useState(false);
    const [address, setAddress] = useState('');
    const [port, setPort] = useState(0);
    const [version, setVersion] = useState('');
    const [community, setCommunity] = useState('');
    const [secret, setSecret] = useState('');
    const [securityEngine, setSecurityEngine] = useState('');
    const [walkInterval, setWalkInterval] = useState(0);
    const [profiles, setProfiles] = useState([]);
    const [initProfiles, setInitProfiles] = useState([]);
    const [smartProfiles, setSmartProfiles] = useState(false);

    const handleRequestOpen = () => {
        setOpen(true);
    };

    const handleRequestClose = () => {
        setOpen(false);
        modalToggle?.current?.focus(); // Must return focus to the invoking element when the modal closes
    };

    useEffect(() => {
        let isMounted = true;
        console.log('use effect')
        axios.get('http://127.0.0.1:5000/profiles')
        .then((response) => {
            if (isMounted)
                setInitProfiles(response.data);
        console.log('data: ', response.data);
        })
        return () => { isMounted = false }
    }, [setInitProfiles]);

    const postInventory = (inventoryObj) => {
        axios.post('http://127.0.0.1:5000/inventory/add', inventoryObj)
            .then((response) => {
                console.log(response)
        })
    }

    const handleApply = useCallback(
    (e) => {
        var inventoryObj = {
        address: address,
        port: port,
        version: version,
        community: community,
        secret: secret,
        security_engine: securityEngine,
        walk_interval: walkInterval,
        profiles: profiles,
        smart_profiles: smartProfiles,
        }
        console.log(inventoryObj)
        postInventory(inventoryObj)},
        [address, port, version, community, secret, securityEngine, walkInterval, profiles, smartProfiles]
    );

    const handleChangeAddress = useCallback((e, { value: val }) => {
        setAddress(val);
    }, []);

    const handleChangePort = useCallback((e, { value: val }) => {
        setPort(val);
    }, []);

    const handleChangeVersion = useCallback((e, { value: val }) => {
        setVersion(val);
    }, []);

    const handleChangeCommunity = useCallback((e, { value: val }) => {
        setCommunity(val);
    }, []);

    const handleChangeSecret = useCallback((e, { value: val }) => {
        setSecret(val);
    }, []);

    const handleChangeSecurityEngine = useCallback((e, { value: val }) => {
        setSecurityEngine(val);
    }, []);

    const handleChangeWalkInterval = useCallback((e, { value: val }) => {
        setWalkInterval(val);
    }, []);

    const handleChangeSmartProfiles = useCallback((e, { value: val }) => {
        setSmartProfiles(val);
    }, []);

    const multiselectOptions = initProfiles.map((v) => (
        <Multiselect.Option key={v} label={v} value={v} />
    ));

    const handleChange = (e, { values }) => {
        console.log(values);
        setProfiles(values);
    }

    return (
        <div>
            <Button onClick={handleRequestOpen} ref={modalToggle} label="Add new device" />
            <Modal onRequestClose={handleRequestClose} open={open} style={{ width: '600px' }}>
                <Modal.Header title="Add new device for polling" onRequestClose={handleRequestClose} />
                <Modal.Body>
                    <ControlGroup label="IP address">
                        <Text value={address} onChange={handleChangeAddress}/>
                    </ControlGroup>
                    <ControlGroup label="Port" >
                        <Number value={port} onChange={handleChangePort}/>
                    </ControlGroup>

                    <ControlGroup
                    label="SNMP version"
                    labelFor="customized-select-after"
                    help="Clicking the label will focus/activate the Select rather than the default first Text."
                    >
                        <Select defaultValue="1" inputId="customized-select-after" value={version} onChange={handleChangeVersion}>
                            <Select.Option label="v1" value="1"/>
                            <Select.Option label="v2c" value="v2c"/>
                            <Select.Option label="v3" value="3"/>
                        </Select>
                    </ControlGroup>

                    <ControlGroup label="community">
                        <Text value={community} onChange={handleChangeCommunity}/>
                    </ControlGroup>


                    <ControlGroup label="Secret">
                        <Text value={secret} onChange={handleChangeSecret}/>
                    </ControlGroup>

                    <ControlGroup label="Security Engine">
                        <Text value={securityEngine} onChange={handleChangeSecurityEngine}/>
                    </ControlGroup>

                    <ControlGroup label="Walk Interval">
                        <Number value={walkInterval} onChange={handleChangeWalkInterval}/>
                    </ControlGroup>

                    <ControlGroup label="Profiles">
                        <Multiselect onChange={handleChange}>
                            {multiselectOptions}
                        </Multiselect>
                    </ControlGroup>

                    <ControlGroup label="Smart Profiles enabled">
                        <RadioBar defaultValue={1} value={smartProfiles} onChange={handleChangeSmartProfiles}>
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

export default InventoryModal;
