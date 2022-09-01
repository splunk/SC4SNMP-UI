import React from 'react';
import TabLayout from '@splunk/react-ui/TabLayout';
import ProfilePanel from "./ProfilePanel";
import InventoryList from "./InventoryList";
import InventoryModal from "./InventoryModal";
import ProfilesModal from "./ProfilesModal";

function Uncontrolled() {
    return (
        <TabLayout defaultActivePanelId="one">
            <TabLayout.Panel label="Profiles" panelId="one">
                <ProfilePanel />
                <ProfilesModal />
            </TabLayout.Panel>
            <TabLayout.Panel label="Inventory" panelId="two" style={{ margin: 20 }}>
                <InventoryList />
                <InventoryModal />
            </TabLayout.Panel>
        </TabLayout>
    );
}

export default Uncontrolled;
