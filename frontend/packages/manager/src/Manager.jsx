import React, { useContext } from 'react';

import ErrorsModal from "./components/ErrorsModal";
import Menu from "./components/menu_header/Menu";
import Header from "./components/menu_header/Header";
import TabPanels from "./components/menu_header/TabPanels";
import LoginPage from "./components/auth/LoginPage";

import { ButtonsContextProvider } from "./store/buttons-contx";
import { ErrorsModalContextProvider } from "./store/errors-modal-contxt";
import { MenuHeaderContxtProvider } from "./store/menu-header-contxt";

import { ProfileContxtProvider } from "./store/profile-contxt";
import { InventoryContextProvider } from "./store/inventory-contxt";
import { GroupContextProvider } from "./store/group-contxt";
import { AuthContextProvider } from "./store/auth-contxt";
import AuthContext from "./store/auth-contxt";
import { FontStyles } from "./styles/FontsStyles";

function AuthGate({ children }) {
    const authCtx = useContext(AuthContext);

    if (authCtx.isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#171d21', color: '#c3cbd4' }}>
                Loading...
            </div>
        );
    }

    if (!authCtx.isAuthenticated) {
        return <LoginPage />;
    }

    return children;
}

function Uncontrolled() {

    return (
        <AuthContextProvider>
            <FontStyles/>
            <AuthGate>
                <ButtonsContextProvider>
                    <ErrorsModalContextProvider>
                        <MenuHeaderContxtProvider>
                            <ProfileContxtProvider>
                                <GroupContextProvider>
                                    <InventoryContextProvider>
                                        <Menu/>
                                        <Header/>
                                        <TabPanels/>
                                    </InventoryContextProvider>
                                </GroupContextProvider>
                            </ProfileContxtProvider>
                        </MenuHeaderContxtProvider>
                        <ErrorsModal />
                    </ErrorsModalContextProvider>
                </ButtonsContextProvider>
            </AuthGate>
        </AuthContextProvider>
    );
}

export default Uncontrolled;
