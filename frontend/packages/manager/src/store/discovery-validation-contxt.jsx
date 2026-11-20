import React, { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DiscoveryValidationContext = createContext();
export function DiscoveryValidationContextProvider({ children }) {
    const [errors, setErrors] = useState({});
    const context = useMemo(() => ({
        errors,
        setErrors: (field, messages) => setErrors((value) => ({ ...value, [field]: messages })),
        resetErrors: (field) => setErrors((value) => ({ ...value, [field]: [] })),
        resetAllErrors: () => setErrors({}),
    }), [errors]);
    return <DiscoveryValidationContext.Provider value={context}>{children}</DiscoveryValidationContext.Provider>;
}
DiscoveryValidationContextProvider.propTypes = { children: PropTypes.node.isRequired };
export const useDiscoveryValidationContext = () => useContext(DiscoveryValidationContext);
