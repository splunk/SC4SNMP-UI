import React, {useState, createContext} from 'react';

const ProfilesValidationContxt = createContext();

export function ProfilesValidationContxtProvider(props){
    const [profileNameErrors, setProfileNameErrors] = useState(null);
    const [frequencyErrors, setFrequencyErrors] = useState(null);
    const [varBindsErrors, setVarBindsErrors] = useState(null);
    const [varBindsExistErrors, setVarBindsExistErrors] = useState(null);
    const [conditionFieldErrors, setConditionFieldErrors] = useState(null);
    const [conditionPatternsErrors, setConditionPatternsErrors] = useState(null);
    const [patternsExistErrors, setPatternsExistErrors] = useState(null);
    const [conditionalFieldErrors, setConditionalFieldErrors] = useState(null);
    const [conditionalValuesErrors, setConditionalValuesErrors] = useState(null);
    const [conditionalValuesExistErrors, setConditionalValuesExistErrors] = useState(null);
    const [conditionalExistErrors, setConditionalExistErrors] = useState(null);

    const resetAllErrors = () =>{
        setProfileNameErrors(null);
        setFrequencyErrors(null);
        setConditionFieldErrors(null);
        setConditionPatternsErrors(null);
        setVarBindsErrors(null);
        setConditionalFieldErrors(null);
        setConditionalValuesErrors(null);
        setVarBindsExistErrors(null);
        setPatternsExistErrors(null);
        setConditionalValuesExistErrors(null);
        setConditionalExistErrors(null);
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
            case "conditionalField":
                setConditionalFieldErrors(null);
                break;
            case "conditionalValues":
                setConditionalValuesErrors(null);
                break;
            case "patternsExist":
                setPatternsExistErrors(null);
                break;
            case "conditionalValuesExist":
                setConditionalValuesExistErrors(null);
                break;
            case "conditionalExist":
                setConditionalExistErrors(null);
                break;
            case "varBindsExist":
                setVarBindsExistErrors(null);
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
            case "conditionalField":
                setConditionalFieldErrors(errors);
                break;
            case "conditionalValues":
                setConditionalValuesErrors(errors);
                break;
            case "patternsExist":
                setPatternsExistErrors(errors);
                break;
            case "conditionalValuesExist":
                setConditionalValuesExistErrors(errors);
                break;
            case "conditionalExist":
                setConditionalExistErrors(errors);
                break;
            case "varBindsExist":
                setVarBindsExistErrors(errors);
                break;
            default:
                break;
        }
    };

    const context = {
        profileNameErrors,
        setProfileNameErrors,

        frequencyErrors,
        setFrequencyErrors,

        varBindsErrors,
        setVarBindsErrors,

        varBindsExistErrors,
        setVarBindsExistErrors,

        conditionFieldErrors,
        setConditionFieldErrors,

        conditionPatternsErrors,
        setConditionPatternsErrors,

        patternsExistErrors,
        setPatternsExistErrors,

        conditionalFieldErrors,
        setConditionalFieldErrors,

        conditionalValuesErrors,
        setConditionalValuesErrors,

        conditionalValuesExistErrors,
        setConditionalValuesExistErrors,

        conditionalExistErrors,
        setConditionalExistErrors,

        resetAllErrors,
        resetErrors,
        setErrors,
    };

    return (
        <ProfilesValidationContxt.Provider value={context}>
            {props.children}
        </ProfilesValidationContxt.Provider>
    )
};

export default ProfilesValidationContxt;
