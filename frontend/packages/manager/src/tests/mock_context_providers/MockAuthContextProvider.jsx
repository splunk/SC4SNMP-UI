import React from 'react';
import PropTypes from 'prop-types';
import AuthContext from '../../store/auth-contxt';

const defaultAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    username: "",
    authEnabled: true,
    login: jest.fn(() => Promise.resolve({ data: { username: "admin" } })),
    logout: jest.fn(() => Promise.resolve()),
    checkAuth: jest.fn(),
    sessionExpiredMessage: "",
    clearSessionExpiredMessage: jest.fn(),
};

export function MockAuthContextProvider({ children, overrides = {} }) {
    const context = { ...defaultAuthContext, ...overrides };
    return (
        <AuthContext.Provider value={context}>
            {children}
        </AuthContext.Provider>
    );
}

MockAuthContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
    overrides: PropTypes.object,
};
