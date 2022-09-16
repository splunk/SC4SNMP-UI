import React, {useState, createContext, useRef} from 'react';

const ProfileContext = createContext({
    profileId: null,
    setProfileId: () => {},
    deleteOpen: false,
    setDeleteOpen: () => {},
    deleteModalToggle: null,
    profilesChange: true,
    setProfilesChange: (profName) => {},
    addOpen: false,
    setAddOpen: () => {},
    addModalToggle: null,

    profileName: "",
    setProfileName: () => {},
    frequency: 1,
    setFrequency: () => {},
    varBinds: null,
    setVarBinds: () => {},
    conditions: null,
    setConditions: () => {},
    isEdit: false,
    setIsEdit: () => {}
});

export function ProfileContxtProvider(props) {
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
        setProfilesChange(!profilesChange);
    }

    const context = {
        profileId: profileId,
        setProfileId: setProfileId,
        deleteOpen: deleteOpen,
        setDeleteOpen: setDeleteOpen,
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
