import React from 'react';
import TabLayout from '@splunk/react-ui/TabLayout';
import ProfilesPage from "./pages/ProfilesPage";
import InventoryPage from "./pages/InventoryPage";
import GroupsPage from "./pages/GroupsPage";
import { ProfileContxtProvider } from "./store/profile-contxt";
import { InventoryContextProvider } from "./store/inventory-contxt";
import { GroupContextProvider } from "./store/group-contxt";
import { ButtonsContextProvider } from "./store/buttons-contx";
import { InventoryDevicesValidationContxtProvider } from "./store/inventory-devices-validation-contxt";
import { ProfilesValidationContxtProvider } from "./store/profiles-validation-contxt";

function Uncontrolled() {
    return (
        <ButtonsContextProvider>
            <TabLayout defaultActivePanelId="one">
                <TabLayout.Panel label="Profiles" panelId="one">
                    <ProfileContxtProvider>
                        <ProfilesValidationContxtProvider>
                            <ProfilesPage />
                        </ProfilesValidationContxtProvider>
                    </ProfileContxtProvider>
                </TabLayout.Panel>
                <TabLayout.Panel label="Groups" panelId="two">
                    <GroupContextProvider>
                        <InventoryDevicesValidationContxtProvider>
                            <GroupsPage />
                        </InventoryDevicesValidationContxtProvider>
                    </GroupContextProvider>
                </TabLayout.Panel>
                <TabLayout.Panel label="Inventory" panelId="three">
                    <InventoryContextProvider>
                        <InventoryDevicesValidationContxtProvider>
                            <InventoryPage />
                        </InventoryDevicesValidationContxtProvider>
                    </InventoryContextProvider>
                </TabLayout.Panel>
            </TabLayout>
        </ButtonsContextProvider>
    );
}

export default Uncontrolled;
