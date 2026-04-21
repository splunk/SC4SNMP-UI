import React from 'react';
import AuthContext from '../../store/auth-contxt';

const defaultAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    username: "",
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
