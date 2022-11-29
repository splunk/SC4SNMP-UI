import React, {useCallback, useContext, useState} from 'react';
import { Link, Route, Routes, Switch } from 'react-router-dom';

import ErrorsModal from "./components/ErrorsModal";
import Menu from "./components/menu_header/Menu";
import Header from "./components/menu_header/Header";
import TabPanels from "./components/menu_header/TabPanels";
import MenuHeaderContxt from './store/menu-header-contxt';


import { ButtonsContextProvider } from "./store/buttons-contx";
import { ErrorsModalContextProvider } from "./store/errors-modal-contxt";
import { MenuHeaderContxtProvider } from "./store/menu-header-contxt";

import { ProfileContxtProvider } from "./store/profile-contxt";
import { InventoryContextProvider } from "./store/inventory-contxt";
import { GroupContextProvider } from "./store/group-contxt";

import { FontStyles } from "./styles/FonstStyles";
function Uncontrolled() {
    const MenuCtx = useContext(MenuHeaderContxt);
    return (
        <ButtonsContextProvider>
            <FontStyles/>
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
    );
}

export default Uncontrolled;
