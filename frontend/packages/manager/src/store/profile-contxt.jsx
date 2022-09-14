import React, {useState, createContext, useRef} from 'react';

const ProfileContext = createContext({
    deleteProfileName: "",
    deleteOpen: false,
    deleteModalToggle: null,
    setDeleteOpen: () => {},
    deleteProfile: (profName) => {},
    profilesChange: true,
    setProfilesChange: (profName) => {},
    addOpen: false,
    addModalToggle: null,
    setAddOpen: () => {},

    profileName: "",
    setProfileName: () => {},
    profileOriginalName: "",
    setProfileOriginalName: () => {},
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
    const [deleteProfileName, setDeleteProfileName] = useState("");
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
    const [profileOriginalName, setProfileOriginalName] = useState("");

    function deleteProfileHandler(profileName){
        setDeleteProfileName(profileName);
    }

    function profilesChangeHandler() {
        setProfilesChange(!profilesChange);
    }

    const context = {
        deleteProfileName: deleteProfileName,
        deleteOpen: deleteOpen,
        deleteModalToggle: deleteModalToggle,
        setDeleteOpen: setDeleteOpen,
        setDeleteProfile: deleteProfileHandler,
        profilesChange: profilesChange,
        makeProfilesChange: profilesChangeHandler,
        addOpen: addOpen,
        addModalToggle: addModalToggle,
        setAddOpen: setAddOpen,

        profileName: profileName,
        setProfileName: setProfileName,
        profileOriginalName: profileOriginalName,
        setProfileOriginalName: setProfileOriginalName,
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
