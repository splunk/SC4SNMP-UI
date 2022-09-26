import React from 'react';
import TabLayout from '@splunk/react-ui/TabLayout';
import ProfilesPage from "./pages/ProfilesPage";
import InventoryPage from "./pages/InventoryPage"
import GroupsPage from "./pages/GroupsPage"
import { ProfileContxtProvider } from "./store/profile-contxt";
import { InventoryContextProvider } from "./store/inventory-contxt";
import { GroupContextProvider } from "./store/group-contxt";
import { ButtonsContextProvider } from "./store/buttons-contx";

function Uncontrolled() {
    return (
        <TabLayout defaultActivePanelId="three">
            <TabLayout.Panel label="Profiles" panelId="one">
                <ButtonsContextProvider>
                    <ProfileContxtProvider>
                        <ProfilesPage />
                    </ProfileContxtProvider>
                </ButtonsContextProvider>
            </TabLayout.Panel>
            <TabLayout.Panel label="Inventory" panelId="two">
                <ButtonsContextProvider>
                    <InventoryContextProvider>
                        <InventoryPage />
                    </InventoryContextProvider>
                </ButtonsContextProvider>
            </TabLayout.Panel>
            <TabLayout.Panel label="Groups" panelId="three">
                <ButtonsContextProvider>
                    <GroupContextProvider>
                        <GroupsPage />
                    </GroupContextProvider>
                </ButtonsContextProvider>
            </TabLayout.Panel>
        </TabLayout>
    );
}

export default Uncontrolled;
