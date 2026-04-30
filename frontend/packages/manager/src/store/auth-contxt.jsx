import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthContextProvider(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");

    const checkAuth = useCallback(() => {
        setIsLoading(true);
        api.get("/auth/status")
            .then((response) => {
                setIsAuthenticated(true);
                setUsername(response.data.username || "");
                setIsLoading(false);
            })
            .catch(() => {
                setIsAuthenticated(false);
                setUsername("");
                setIsLoading(false);
            });
    }, []);

    const login = useCallback((user, password) => {
        return api.post("/auth/login", { username: user, password: password })
            .then((response) => {
                setIsAuthenticated(true);
                setUsername(response.data.username || user);
                setSessionExpiredMessage("");
                return response;
            });
    }, []);

    const logout = useCallback(() => {
        return api.post("/auth/logout")
            .then(() => {
                setIsAuthenticated(false);
                setUsername("");
                setSessionExpiredMessage("");
            })
            .catch(() => {
                setIsAuthenticated(false);
                setUsername("");
                setSessionExpiredMessage("");
            });
    }, []);

    const clearSessionExpiredMessage = useCallback(() => {
        setSessionExpiredMessage("");
    }, []);

    useEffect(() => {
        checkAuth();

        const handleUnauthorized = (event) => {
            const message = event && event.detail && event.detail.message;
            setIsAuthenticated((wasAuthenticated) => {
                if (wasAuthenticated && message) {
                    setSessionExpiredMessage(message);
                }
                return false;
            });
            setUsername("");
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [checkAuth]);

    const context = {
        isAuthenticated,
        isLoading,
        username,
        login,
        logout,
        checkAuth,
        sessionExpiredMessage,
        clearSessionExpiredMessage,
    };

    return (
        <AuthContext.Provider value={context}>
            {props.children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
export default AuthContext;
