import React, {useContext} from 'react';
import MenuHeaderContxt from '../../store/menu-header-contxt';
import ProfilesPage from "../../pages/ProfilesPage";
import InventoryPage from "../../pages/InventoryPage";
import GroupsPage from "../../pages/GroupsPage";

import { InventoryDevicesValidationContxtProvider } from "../../store/inventory-devices-validation-contxt";
import { ProfilesValidationContxtProvider } from "../../store/profiles-validation-contxt";


function TabPanels(){
    const MenuCtx = useContext(MenuHeaderContxt);

    return(
        <div>
            {
                MenuCtx.activeTabId == "Profiles" ?
                    <ProfilesValidationContxtProvider>
                        <ProfilesPage />
                    </ProfilesValidationContxtProvider>
                    : null
            }
            {
                MenuCtx.activeTabId == "Groups" ?
                        <InventoryDevicesValidationContxtProvider>
                            <GroupsPage />
                        </InventoryDevicesValidationContxtProvider>
                     : null
            }
            {
                MenuCtx.activeTabId == "Inventory" ?
                        <InventoryDevicesValidationContxtProvider>
                            <InventoryPage />
                        </InventoryDevicesValidationContxtProvider>
                     : null
            }
        </div>
    )
};

export default TabPanels;
