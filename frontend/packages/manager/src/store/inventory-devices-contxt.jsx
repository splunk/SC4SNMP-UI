import React, {useState, createContext} from 'react';

const InventoryDevicesValidationContxt = createContext();

export function InventoryDevicesValidationContxtProvider(props){
    const [groupNameErrors, setGroupNameErrors] = useState(null);
    const [addressErrors, setAddressErrors] = useState(null);
    const [portErrors, setPortErrors] = useState(null);
    const [communityErrors, setCommunityErrors] = useState(null);
    const [secretErrors, setSecretErrors] = useState(null);
    const [securityEngineErrors, setSecurityEngineErrors] = useState(null);
    const [walkIntervalErrors, setWalkIntervalErrors] = useState(null);
    const [profilesErrors, setProfilesErrors] = useState(null);

    const resetAllErrors = () =>{
        setGroupNameErrors(null);
        setAddressErrors(null);
        setPortErrors(null);
        setCommunityErrors(null);
        setSecretErrors(null);
        setSecurityEngineErrors(null);
        setWalkIntervalErrors(null);
        setProfilesErrors(null);
    };

    const resetErrors = (category) =>{
        switch (category){
            case "groupName":
                setGroupNameErrors(null);
            case "address":
                setAddressErrors(null);
                break;
            case "port":
                setPortErrors(null);
                break;
            case "community":
                setCommunityErrors(null);
                break;
            case "secret":
                setSecretErrors(null);
                break;
            case "securityEngine":
                setSecurityEngineErrors(null);
                break;
            case "walkInterval":
                setWalkIntervalErrors(null);
            case "profiles":
                setProfilesErrors(null);
            default:
                break;
        };
    };

    const setErrors = (category, errors) =>{
        switch (category){
            case "groupName":
                setGroupNameErrors(errors);
            case "address":
                setAddressErrors(errors);
                break;
            case "port":
                setPortErrors(errors);
                break;
            case "community":
                setCommunityErrors(errors);
                break;
            case "secret":
                setSecretErrors(errors);
                break;
            case "securityEngine":
                setSecurityEngineErrors(errors);
                break;
            case "walkInterval":
                setWalkIntervalErrors(errors);
            case "profiles":
                setProfilesErrors(errors);
            default:
                break;
        };
    };

    const context = {
        groupNameErrors: groupNameErrors,
        addressErrors: addressErrors,
        portErrors: portErrors,
        communityErrors: communityErrors,
        secretErrors: secretErrors,
        securityEngineErrors: securityEngineErrors,
        walkIntervalErrors: walkIntervalErrors,
        profilesErrors: profilesErrors,
        resetAllErrors: resetAllErrors,
        resetErrors: resetErrors,
        setErrors: setErrors
    }

    return (
        <InventoryDevicesValidationContxt.Provider value={context}>
            {props.children}
        </InventoryDevicesValidationContxt.Provider>
    )
};

export default InventoryDevicesValidationContxt;
