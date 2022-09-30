import React, {useState, createContext} from 'react';

const ProfilesValidationContxt = createContext();

export function ProfilesValidationContxtProvider(props){
    const [profileNameErrors, setProfileNameErrors] = useState(null);
    const [frequencyErrors, setFrequencyErrors] = useState(null);
    const [varBindsErrors, setVarBindsErrors] = useState(null);
    const [conditionFieldErrors, setConditionFieldErrors] = useState(null);
    const [conditionPatternsErrors, setConditionPatternsErrors] = useState(null);

    const resetAllErrors = () =>{
        setProfileNameErrors(null);
        setFrequencyErrors(null);
        setConditionFieldErrors(null);
        setConditionPatternsErrors(null);
        setVarBindsErrors(null);
    };

     const resetErrors = (category) =>{
        switch (category){
            case "profileName":
                setProfileNameErrors(null);
                break;
            case "frequency":
                setFrequencyErrors(null);
                break;
            case "conditionField":
                setConditionFieldErrors(null);
                break;
            case "conditionPatterns":
                setConditionPatternsErrors(null);
                break;
            case "varBinds":
                setVarBindsErrors(null);
                break;
            default:
                break;
        }
    };

    const setErrors = (category, errors) => {
        switch (category){
            case "profileName":
                setProfileNameErrors(errors);
                break;
            case "frequency":
                setFrequencyErrors(errors);
                break;
            case "conditionField":
                setConditionFieldErrors(errors);
                break;
            case "conditionPatterns":
                setConditionPatternsErrors(errors);
                break;
            case "varBinds":
                setVarBindsErrors(errors);
                break;
            default:
                break;
        }
    };

    const context = {
        profileNameErrors: profileNameErrors,
        setProfileNameErrors: setProfileNameErrors,
        frequencyErrors: frequencyErrors,
        setFrequencyErrors: setFrequencyErrors,
        varBindsErrors: varBindsErrors,
        setVarBindsErrors: setVarBindsErrors,
        conditionFieldErrors: conditionFieldErrors,
        setConditionFieldErrors: setConditionFieldErrors,
        conditionPatternsErrors: conditionPatternsErrors,
        setConditionPatternsErrors: setConditionPatternsErrors,
        resetAllErrors: resetAllErrors,
        resetErrors: resetErrors,
        setErrors: setErrors,
    };

    return (
        <ProfilesValidationContxt.Provider value={context}>
            {props.children}
        </ProfilesValidationContxt.Provider>
    )
};

export default ProfilesValidationContxt;
