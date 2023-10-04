import React, {useState} from "react";
import {jest} from "@jest/globals";
import GroupContext from "../../store/group-contxt";

const setStateMock = jest.fn()
export function MockGroupContextProvider(props){

    // Is edit
    const [isGroupEdit, setIsGroupEdit] = useState(false);
    const [isDeviceEdit, setIsDeviceEdit] = useState(false);

    // Variables for group
    const [groupName, setGroupName] = useState('');
    const [devices, setDevices] = useState([]);
    const [groupId, setGroupId] = useState(null);
    const [inventoryConfig, setInventoryConfig] = useState({
                                        port: "",
                                        version: "",
                                        community: "",
                                        secret: "",
                                        securityEngine: ""
                                    });

    // Variables for device
    const [deviceId, setDeviceId] = useState(null);
    const [address, setAddress] = useState('');
    const [port, setPort] = useState("");
    const [version, setVersion] = useState('1');
    const [community, setCommunity] = useState('');
    const [secret, setSecret] = useState('');
    const [securityEngine, setSecurityEngine] = useState('');

    function resetDevice() {
        setDeviceId(null);
        setAddress('');
        setPort('');
        setVersion('');
        setCommunity('');
        setSecret('');
        setSecurityEngine('');
    }

    // Data for auto refreshing groups panel
    const [groupsChange, setGroupsChange] = useState(true);
    const [editedGroupId, setEditedGroupId] = useState(null);

    function groupsChangeHandler() {
        setGroupsChange(prev => {return !prev;});
    }

    const context = {
        // Controling Modals
        addGroupOpen: true,
        setAddGroupOpen: setStateMock,
        addDeviceOpen: true,
        setAddDeviceOpen: setStateMock,
        deleteOpen: true,
        setDeleteOpen: setStateMock,
        deleteUrl: "",
        setDeleteUrl: setStateMock,
        deleteName: "",
        setDeleteName: setStateMock,

        addGroupModalToggle: null,

        // Is edit
        isGroupEdit,
        setIsGroupEdit,
        isDeviceEdit,
        setIsDeviceEdit,
        groupId,
        setGroupId,

        // Variables for group
        groupName,
        setGroupName,
        devices,
        setDevices,
        inventoryConfig,
        setInventoryConfig,

        // Variables for device
        deviceId,
        setDeviceId,
        address,
        setAddress,
        port,
        setPort,
        version,
        setVersion,
        community,
        setCommunity,
        secret,
        setSecret,
        securityEngine,
        setSecurityEngine,
        resetDevice,

        // Data for auto refreshing groups panel
        groupsChange,
        makeGroupsChange: groupsChangeHandler,
        editedGroupId,
        setEditedGroupId,
    };

    return (
        <GroupContext.Provider value={context}>
            {props.children}
        </GroupContext.Provider>
    )
};
