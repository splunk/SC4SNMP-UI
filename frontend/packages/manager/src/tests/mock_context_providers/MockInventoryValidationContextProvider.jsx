import React, {useState} from 'react';
import PropTypes from 'prop-types';
import InventoryDevicesValidationContxt from "../../store/inventory-devices-validation-contxt";

export function MockInventoryValidationContextProvider(props){
    const [groupNameErrors, setGroupNameErrors] = useState(null);
    const [addressErrors, setAddressErrors] = useState(null);
    const [portErrors, setPortErrors] = useState(null);
    const [communityErrors, setCommunityErrors] = useState(null);
    const [secretErrors, setSecretErrors] = useState(null);
    const [securityEngineErrors, setSecurityEngineErrors] = useState(null);
    const [walkIntervalErrors, setWalkIntervalErrors] = useState(null);
    const [maxOidToProcessErrors, setMaxOidToProcessErrors] = useState(null);
    const [profilesErrors, setProfilesErrors] = useState(null);

    const resetAllErrors = () =>{
        setGroupNameErrors(null);
        setAddressErrors(null);
        setPortErrors(null);
        setCommunityErrors(null);
        setSecretErrors(null);
        setSecurityEngineErrors(null);
        setWalkIntervalErrors(null);
        setMaxOidToProcessErrors(null);
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
                break;
            case "maxOidToProcess":
                setMaxOidToProcessErrors(null);
                break;
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
                break;
            case "maxOidToProcess":
                setMaxOidToProcessErrors(errors);
                break;
            default:
                break;
        };
    };

    const context = {
        groupNameErrors,
        addressErrors,
        portErrors,
        communityErrors,
        secretErrors,
        securityEngineErrors,
        walkIntervalErrors,
        maxOidToProcessErrors,
        profilesErrors,
        resetAllErrors,
        resetErrors,
        setErrors
    }

    return (
        <InventoryDevicesValidationContxt.Provider value={context}>
            {props.children}
        </InventoryDevicesValidationContxt.Provider>
    )
};

MockInventoryValidationContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
