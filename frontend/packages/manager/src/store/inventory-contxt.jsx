import React, {useState, createContext, useRef, useContext} from 'react';
import { useButtonsContext } from "./buttons-contx";

const InventoryContext = createContext();

export function InventoryContextProvider(props){
    const BtnCtx = useButtonsContext();

    // data for DeleteInventoryModal
    const [inventoryId, setInventoryId] = useState(null);

    // data for AddInventoryModal
    const [addOpen, setAddOpen] = useState(false);
    const addModalToggle = useRef(null);


    // data for auto refreshing inventory panel
    const [inventoryChange, setInventoryChange] = useState(true);

    function inventoryChangeHandler() {
        setInventoryChange(prev => {return !prev;});
    }

    // data for editing in AddInventoryModal
    const [isEdit, setIsEdit] = useState(false);
    const [address, setAddress] = useState('');
    const [port, setPort] = useState('161');
    const [version, setVersion] = useState('2c');
    const [community, setCommunity] = useState('');
    const [secret, setSecret] = useState('');
    const [securityEngine, setSecurityEngine] = useState('');
    const [walkInterval, setWalkInterval] = useState(1800);
    const [profiles, setProfiles] = useState([]);
    const [smartProfiles, setSmartProfiles] = useState(false);
    const [inventoryType, setInventoryType] = useState("Host");

    function resetFormData() {
        setInventoryId(null);
        setAddress('');
        setPort('161');
        setVersion('2c');
        setCommunity('');
        setSecret('');
        setSecurityEngine('');
        setWalkInterval(1800);
        setProfiles([]);
        setSmartProfiles(false);
    }

    const context = {
        inventoryId,
        setInventoryId,
        deleteOpen: BtnCtx.deleteOpen,
        setDeleteOpen: BtnCtx.setDeleteOpen,

        addOpen,
        setAddOpen,
        addModalToggle,

        inventoryChange,
        makeInventoryChange: inventoryChangeHandler,

        isEdit,
        setIsEdit,
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
        walkInterval,
        setWalkInterval,
        profiles,
        setProfiles,
        smartProfiles,
        setSmartProfiles,
        inventoryType,
        setInventoryType,

        resetFormData
    };

    return (
        <InventoryContext.Provider value={context}>
            {props.children}
        </InventoryContext.Provider>
    )
};

export const useInventoryContext = () => useContext(InventoryContext);
export default InventoryContext;
