import React, {useState, createContext, useRef} from 'react';

const ProfileValidationContext = createContext({
    varBindsErrors: null,
    setVarBindsErrors: () => {},
    conditionErrors: null,
    setConditionErrors: () => {},
    reloadVarBinds: false,
    setReloadVarBinds: () => {}
});

export function ProfileValidationContextProvider(props) {
    const [conditionErrors, setConditionErrors] = useState(null);
    const [varBindsErrors, setVarBindsErrors] = useState(null);
    const [reloadVarBinds, setReloadVarBinds] = useState(false);
    const context = {
        varBindsErrors: varBindsErrors,
        setVarBindsErrors: setVarBindsErrors,
        conditionErrors: conditionErrors,
        setConditionErrors: setConditionErrors,
        reloadVarBinds: reloadVarBinds,
        setReloadVarBinds: setReloadVarBinds
    };

    return (
        <ProfileValidationContext.Provider value={context}>
            {props.children}
        </ProfileValidationContext.Provider>
    );
};

export default ProfileValidationContext;
