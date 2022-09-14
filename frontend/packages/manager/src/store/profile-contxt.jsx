import React, {useState, createContext, useRef} from 'react';

const ProfileContext = createContext({
    profileName: "",
    deleteOpen: false,
    deleteModalToggle: null,
    setDeleteOpen: () => {},
    deleteProfile: (profName) => {},
    profilesChange: 0,
    setProfilesChange: (profName) => {},
    addOpen: false,
    addModalToggle: null,
    setAddOpen: () => {}
});

export function ProfileContxtProvider(props) {
    const [deleteProfileName, setDeleteProfileName] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const deleteModalToggle = useRef(null);

    const [addOpen, setAddOpen] = useState(false);
    const addModalToggle = useRef(null);

    const [profilesChange, setProfilesChange] = useState(true);

    function deleteProfileHandler(profileName){
        setDeleteProfileName(profileName);
    }

    function profilesChangeHandler() {
        setProfilesChange(!profilesChange);
    }

    const context = {
        profileName: deleteProfileName,
        deleteOpen: deleteOpen,
        deleteModalToggle: deleteModalToggle,
        setDeleteOpen: setDeleteOpen,
        setDeleteProfile: deleteProfileHandler,
        profilesChange: profilesChange,
        makeProfilesChange: profilesChangeHandler,
        addOpen: addOpen,
        addModalToggle: addModalToggle,
        setAddOpen: setAddOpen
    };

    return(
        <ProfileContext.Provider value={context}>
            {props.children}
        </ProfileContext.Provider>
    )
}

export default ProfileContext;
