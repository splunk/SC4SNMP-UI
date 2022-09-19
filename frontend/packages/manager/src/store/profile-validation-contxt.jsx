import React, {useState, createContext, useRef} from 'react';

const ProfileValidationContext = createContext({
    varBindsErrors: null,
    setVarBindsErrors: () => {},
});

export function ProfileValidationContextProvider(props) {

};
