import React, {useState, createContext, useRef, useContext} from 'react';
import { useButtonsContext } from "./buttons-contx";

const GroupContext = createContext();

export function GroupContextProvider(props){
    const BtnCtx = useButtonsContext();

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
    const [groupId, setGroupId] = useState(null);
    const [inventoryConfig, setInventoryConfig] = useState({
                                        port: "",
                                        version: "",
                                        community: "",
                                        secret: "",
                                        securityEngine: ""
                                    });
    const [groupWarning, setGroupWarning] = useState(null);

    // Variables for device
    const [deviceId, setDeviceId] = useState(null);
    const [address, setAddress] = useState('');
    const [port, setPort] = useState("");
    const [version, setVersion] = useState('');
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
        addGroupOpen,
        setAddGroupOpen,
        addDeviceOpen,
        setAddDeviceOpen,
        deleteOpen: BtnCtx.deleteOpen,
        setDeleteOpen: BtnCtx.setDeleteOpen,
        deleteUrl,
        setDeleteUrl,
        deleteName,
        setDeleteName,

        addGroupModalToggle,

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
        groupWarning,
        setGroupWarning,

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

export const useGroupContext = () => useContext(GroupContext);
export default GroupContext;

