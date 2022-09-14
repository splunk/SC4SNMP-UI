import React, {useState, createContext, useRef} from 'react';

const DeleteProfileContext = createContext({
    profileName: "",
    deleteOpen: false,
    deleteModalToggle: null,
    setDeleteOpen: () => {},
    deleteProfile: (profName) => {}
});

export function DeleteProfileContxtProvider(props) {
    const [deleteProfileName, setDeleteProfileName] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const deleteModalToggle = useRef(null);

    function deleteProfileHandler(profileName){
        setDeleteProfileName(profileName);
    }

    const context = {profileName: deleteProfileName,
            deleteOpen: deleteOpen,
            deleteModalToggle: deleteModalToggle,
            setDeleteOpen: setDeleteOpen,
            setDeleteProfile: deleteProfileHandler
    };

    return(
        <DeleteProfileContext.Provider value={context}>
            {props.children}
        </DeleteProfileContext.Provider>
    )
}

export default DeleteProfileContext;
