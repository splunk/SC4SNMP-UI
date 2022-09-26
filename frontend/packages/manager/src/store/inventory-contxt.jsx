import React, {useState, createContext, useRef, useContext} from 'react';
import ButtonsContext from "./buttons-contx";

const InventoryContext = createContext();

export function InventoryContextProvider(props){
    const BtnCtx = useContext(ButtonsContext);

    // data for DeleteInventoryModal
    const [inventoryId, setInventoryId] = useState(null);

    const rowToggle = useRef(null);

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
    const [port, setPort] = useState(161);
    const [version, setVersion] = useState('2c');
    const [community, setCommunity] = useState('');
    const [secret, setSecret] = useState('');
    const [securityEngine, setSecurityEngine] = useState('');
    const [walkInterval, setWalkInterval] = useState(1800);
    const [profiles, setProfiles] = useState([]);
    const [smartProfiles, setSmartProfiles] = useState(false);

    function resetFormData() {
        setInventoryId(null);
        setAddress('');
        setPort(161);
        setVersion('2c');
        setCommunity('');
        setSecret('');
        setSecurityEngine('');
        setWalkInterval(1800);
        setProfiles([]);
        setSmartProfiles(false);
    }

    const context = {
        inventoryId: inventoryId,
        setInventoryId: setInventoryId,
        deleteOpen: BtnCtx.deleteOpen,
        setDeleteOpen: BtnCtx.setDeleteOpen,

        buttonsOpen: BtnCtx.buttonsOpen,
        setButtonsOpen: BtnCtx.setButtonsOpen,

        addOpen: addOpen,
        setAddOpen: setAddOpen,
        addModalToggle: addModalToggle,

        inventoryChange: inventoryChange,
        makeInventoryChange: inventoryChangeHandler,

        isEdit: isEdit,
        setIsEdit: setIsEdit,
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
        walkInterval: walkInterval,
        setWalkInterval: setWalkInterval,
        profiles: profiles,
        setProfiles: setProfiles,
        smartProfiles: smartProfiles,
        setSmartProfiles: setSmartProfiles,

        resetFormData:resetFormData
    };

    return (
        <InventoryContext.Provider value={context}>
            {props.children}
        </InventoryContext.Provider>
    )
};

export default InventoryContext;
