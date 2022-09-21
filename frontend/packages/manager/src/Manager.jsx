import React from 'react';
import TabLayout from '@splunk/react-ui/TabLayout';
import ProfilesPage from "./pages/ProfilesPage";
import InventoryPage from "./pages/InventoryPage"
import GroupsPage from "./pages/GroupsPage"
import { ProfileContxtProvider } from "./store/profile-contxt";
import { InventoryContextProvider } from "./store/inventory-contxt";

function Uncontrolled() {
    return (
        <TabLayout defaultActivePanelId="two">
            <TabLayout.Panel label="Profiles" panelId="one">
                <ProfileContxtProvider>
                    <ProfilesPage />
                </ProfileContxtProvider>
            </TabLayout.Panel>
            <TabLayout.Panel label="Inventory" panelId="two">
                <InventoryContextProvider>
                    <InventoryPage />
                </InventoryContextProvider>
            </TabLayout.Panel>
            <TabLayout.Panel label="Groups" panelId="three">
                <GroupsPage />
            </TabLayout.Panel>
        </TabLayout>
    );
}

export default Uncontrolled;
