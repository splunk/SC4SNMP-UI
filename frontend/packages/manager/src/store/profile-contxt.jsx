import React, {useState, createContext, useRef} from 'react';

const ProfileContext = createContext({
    profileName: "",
    deleteOpen: false,
    deleteModalToggle: null,
    setDeleteOpen: () => {},
    deleteProfile: (profName) => {},
    profilesChange: 0,
    setProfilesChange: (profName) => {}
});

export function ProfileContxtProvider(props) {
    const [deleteProfileName, setDeleteProfileName] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [profilesChange, setProfilesChange] = useState(true);
    const deleteModalToggle = useRef(null);

    function deleteProfileHandler(profileName){
        setDeleteProfileName(profileName);
    }

    function profilesChangeHandler() {
        setProfilesChange(!profilesChange);
    }

    const context = {profileName: deleteProfileName,
            deleteOpen: deleteOpen,
            deleteModalToggle: deleteModalToggle,
            setDeleteOpen: setDeleteOpen,
            setDeleteProfile: deleteProfileHandler,
            profilesChange: profilesChange,
            makeProfilesChange: profilesChangeHandler
    };

    return(
        <ProfileContext.Provider value={context}>
            {props.children}
        </ProfileContext.Provider>
    )
}

export default ProfileContext;
