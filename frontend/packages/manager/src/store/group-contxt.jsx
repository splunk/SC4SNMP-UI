import React, {useState, createContext, useRef, useContext} from 'react';
import ButtonsContext from "./buttons-contx";

const GroupContext = createContext();

export function GroupContextProvider(props){
    const BtnCtx = useContext(ButtonsContext);

    // Controling Modals
    const [addGroupOpen, setAddGroupOpen] = useState(false);
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);
    const [deleteUrl, setDeleteUrl] = useState('');
    const [deleteName, setDeleteName] = useState('');

    const addGroupModalToggle = useRef(null);

    // Is edit
    const [isGroupEdit, setIsGroupEdit] = useState(false);
    const [isDeviceEdit, setIsDeviceEdit] = useState(false);

    // Variables for group
    const [groupName, setGroupName] = useState('');
    const [devices, setDevices] = useState([]);
    const [groupID, setGroupID] = useState(null);

    // Variables for device
    const [deviceID, setDeviceID] = useState(null);
    const [address, setAddress] = useState('');
    const [port, setPort] = useState(161);
    const [version, setVersion] = useState('2c');
    const [community, setCommunity] = useState('');
    const [secret, setSecret] = useState('');
    const [securityEngine, setSecurityEngine] = useState('');

    function resetDevice() {
        setDeviceID(null);
        setAddress('');
        setPort(161);
        setVersion('2c');
        setCommunity('');
        setSecret('');
        setSecurityEngine('');
    }

    // Data for auto refreshing groups panel
    const [groupsChange, setGroupsChange] = useState(true);
    const [editedGroupID, setEditedGroupID] = useState(null);

    function groupsChangeHandler() {
        setGroupsChange(prev => {return !prev;});
    }

    const context = {
        // Controling Modals
        addGroupOpen: addGroupOpen,
        setAddGroupOpen: setAddGroupOpen,
        addDeviceOpen: addDeviceOpen,
        setAddDeviceOpen: setAddDeviceOpen,
        deleteOpen: BtnCtx.deleteOpen,
        setDeleteOpen: BtnCtx.setDeleteOpen,
        buttonsOpen: BtnCtx.buttonsOpen,
        setButtonsOpen: BtnCtx.setButtonsOpen,
        deleteUrl: deleteUrl,
        setDeleteUrl: setDeleteUrl,
        deleteName: deleteName,
        setDeleteName: setDeleteName,

        addGroupModalToggle: addGroupModalToggle,

        // Is edit
        isGroupEdit: isGroupEdit,
        setIsGroupEdit: setIsGroupEdit,
        isDeviceEdit: isDeviceEdit,
        setIsDeviceEdit: setIsDeviceEdit,
        groupID: groupID,
        setGroupID: setGroupID,

        // Variables for group
        groupName: groupName,
        setGroupName: setGroupName,
        devices: devices,
        setDevices: setDevices,

        // Variables for device
        deviceID: deviceID,
        setDeviceID: setDeviceID,
        address: address,
        setAddress: setAddress,
        port: port,
        setPort: setPort,
        version: version,
        setVersion: setVersion,
        community: community,
        setCommunity: setCommunity,
        secret: secret,
        setSecret: setSecret,
        securityEngine: securityEngine,
        setSecurityEngine: setSecurityEngine,
        resetDevice: resetDevice,

        // Data for auto refreshing groups panel
        groupsChange: groupsChange,
        makeGroupsChange: groupsChangeHandler,
        editedGroupID: editedGroupID,
        setEditedGroupID: setEditedGroupID
    };

    return (
        <GroupContext.Provider value={context}>
            {props.children}
        </GroupContext.Provider>
    )
};

export default GroupContext;

