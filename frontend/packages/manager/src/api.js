import axios from 'axios';
import { backendHost } from './host';

const api = axios.create({
    baseURL: `http://${backendHost}`,
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
});

const AUTH_ENDPOINT_PATHS = ["/auth/login", "/auth/logout", "/auth/status"];

function isAuthEndpoint(config) {
    const url = (config && config.url) || "";
    return AUTH_ENDPOINT_PATHS.some((path) => url.endsWith(path));
}

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            const serverMessage = (error.response.data && error.response.data.message) || "";
            let reason = null;
            let friendlyMessage = "";
            if (serverMessage === "Invalid or expired token") {
                reason = "expired";
                friendlyMessage = "Your session expired. Please sign in again.";
            } else if (serverMessage === "Session timed out due to inactivity") {
                reason = "idle";
                friendlyMessage = "Your session timed out due to inactivity. Please sign in again.";
            }
            window.dispatchEvent(new CustomEvent('auth:unauthorized', {
                detail: { reason, message: friendlyMessage },
            }));

            // Suppress the rejection for non-auth endpoints so background API
            // calls (GroupsList, InventoryList, etc.) do not surface uncaught
            // errors in the UI. The AuthContext reacts to the event above by
            // flipping `isAuthenticated`, which unmounts the caller. Auth
            // endpoints still reject so their own handlers can react.
            if (!isAuthEndpoint(error.config)) {
                return new Promise(() => {});
            }
        }
        return Promise.reject(error);
    }
);

export default api;
