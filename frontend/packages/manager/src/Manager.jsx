import React, {useCallback, useContext, useState} from 'react';
import { Link, Route, Routes, Switch } from 'react-router-dom';
import TabLayout from '@splunk/react-ui/TabLayout';
import ProfilesPage from "./pages/ProfilesPage";
import InventoryPage from "./pages/InventoryPage";
import GroupsPage from "./pages/GroupsPage";
import ErrorsModal from "./components/ErrorsModal";
import { ProfileContxtProvider } from "./store/profile-contxt";
import { InventoryContextProvider } from "./store/inventory-contxt";
import { GroupContextProvider } from "./store/group-contxt";
import { ButtonsContextProvider } from "./store/buttons-contx";
import { InventoryDevicesValidationContxtProvider } from "./store/inventory-devices-validation-contxt";
import { ProfilesValidationContxtProvider } from "./store/profiles-validation-contxt";
import { ErrorsModalContextProvider } from "./store/errors-modal-contxt";
import TabBar from '@splunk/react-ui/TabBar';
import { StyledTab, StyledMenuBar, StyledMenuBarLeft, StyledMenuBarRight } from './styles/MenuBarStyle';

function Uncontrolled() {
    const [activeTabId, setActiveTabId] = useState('Profiles');

    const handleChange = useCallback((e, { selectedTabId }) => {
        setActiveTabId(selectedTabId);
    }, []);

    return (
        <ButtonsContextProvider>
            <ErrorsModalContextProvider>
                 <StyledMenuBar>
                     <StyledMenuBarLeft>
                         <StyledTab activeTabId={activeTabId} onChange={handleChange}>
                            <TabBar.Tab label="Profiles" tabId="Profiles" />
                            <TabBar.Tab label="Groups" tabId="Groups" />
                            <TabBar.Tab label="Inventory" tabId="Inventory" />
                        </StyledTab>
                     </StyledMenuBarLeft>
                     <StyledMenuBarRight>
                        <div>
                            Splunk Connect for SNMP
                        </div>
                     </StyledMenuBarRight>
                 </StyledMenuBar>

                <TabLayout defaultActivePanelId="one">
                    <TabLayout.Panel style={{color:"red"}} label="Profiles" panelId="one">
                        <ProfileContxtProvider>
                            <ProfilesValidationContxtProvider>
                                <ProfilesPage />
                            </ProfilesValidationContxtProvider>
                        </ProfileContxtProvider>
                    </TabLayout.Panel>
                    <TabLayout.Panel style={{color: "#E1E6EB"}} label="Groups" panelId="two">
                        <GroupContextProvider>
                            <InventoryDevicesValidationContxtProvider>
                                <GroupsPage />
                            </InventoryDevicesValidationContxtProvider>
                        </GroupContextProvider>
                    </TabLayout.Panel>
                    <TabLayout.Panel style={{color: "#E1E6EB"}} label="Inventory" panelId="three">
                        <InventoryContextProvider>
                            <InventoryDevicesValidationContxtProvider>
                                <InventoryPage />
                            </InventoryDevicesValidationContxtProvider>
                        </InventoryContextProvider>
                    </TabLayout.Panel>
                </TabLayout>
                <ErrorsModal />
            </ErrorsModalContextProvider>
        </ButtonsContextProvider>
    );
}

export default Uncontrolled;
