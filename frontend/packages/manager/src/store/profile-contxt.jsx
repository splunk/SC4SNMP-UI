import React, {useState, createContext, useRef, useContext} from 'react';
import ButtonsContext from "./buttons-contx";

const ProfileContext = createContext();

export function ProfileContxtProvider(props) {
    const BtnCtx = useContext(ButtonsContext);

    // data for DeleteProfileModal
    const [profileId, setProfileId] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const deleteModalToggle = useRef(null);

    // data for AddProfileModal
    const [addOpen, setAddOpen] = useState(false);
    const addModalToggle = useRef(null);

    // data for auto refreshing profiles panel
    const [profilesChange, setProfilesChange] = useState(true);

    // data for editing in AddProfileModal
    const [profileName, setProfileName] = useState('');
    const [frequency, setFrequency] = useState(1);
    const [varBinds, setVarBinds] = useState(null);
    const [conditions, setConditions] = useState(null);
    const [isEdit, setIsEdit] = useState(false);

    function profilesChangeHandler() {
        setProfilesChange(prev => {return !prev;});
    }

    const context = {
        profileId: profileId,
        setProfileId: setProfileId,
        deleteOpen: BtnCtx.deleteOpen,
        setDeleteOpen: BtnCtx.setDeleteOpen,
        deleteModalToggle: deleteModalToggle,
        profilesChange: profilesChange,
        makeProfilesChange: profilesChangeHandler,
        addOpen: addOpen,
        setAddOpen: setAddOpen,
        addModalToggle: addModalToggle,

        profileName: profileName,
        setProfileName: setProfileName,
        frequency: frequency,
        setFrequency: setFrequency,
        varBinds: varBinds,
        setVarBinds: setVarBinds,
        conditions: conditions,
        setConditions: setConditions,
        isEdit: isEdit,
        setIsEdit: setIsEdit
    };

    return(
        <ProfileContext.Provider value={context}>
            {props.children}
        </ProfileContext.Provider>
    )
}

export default ProfileContext;
