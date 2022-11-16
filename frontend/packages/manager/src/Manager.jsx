import React, {useCallback, useContext, useState} from 'react';
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
import styled from "styled-components";

function Uncontrolled() {
    const [activeTabId, setActiveTabId] = useState('Profiles');

    const handleChange = useCallback((e, { selectedTabId }) => {
        setActiveTabId(selectedTabId);
    }, []);

    const StyledTab = styled(TabBar)`
      border: 0;
      background-color: #3C444D;
      height: 44px;
      border-bottom: 0;
      margin: 0;
      &::before{
        border: 0;
      }
      & > button{
        margin: 0;
        padding: 0;
      }
      & > button:nth-child(1){
        margin-left: 20px;
      }
      & > button:nth-child(1) > div[class*='TabStyles__StyledLabel']{
        width: 47px;
      }

      & > button:nth-child(2){
        margin-left: 27px;
      }
      & > button:nth-child(2) > div[class*='TabStyles__StyledLabel']:nth-child(2){
        width: 405px;
      }

      & > button:nth-child(3){
        margin-left: 27px;
      }

      & > button:nth-child(3) > div[class*='TabStyles__StyledLabel']:nth-child(3){
        width: 58px;
      }

      & > button > div[class*='TabStyles__StyledLabel']{
        font-size: 14px;
        font-weight: 400;
        line-height: 39px;
        color: #E1E6EB;
        border: 0;
        margin: 0;
        padding: 0;
      }

      [aria-selected='true'] > div[class*='TabStyles__StyledUnderline']{
        background-color: #5CC05C;
        bottom: 0;
        width: 100%;
      }
      [aria-selected='true'] > div[class*='TabStyles__StyledLabel']{
        color: #FFFFFF;
        font-weight: 400;
      }
    `;
    return (
        <ButtonsContextProvider>
            <ErrorsModalContextProvider>
                 <StyledTab activeTabId={activeTabId} onChange={handleChange}>
                    <TabBar.Tab label="Profiles" tabId="Profiles" />
                    <TabBar.Tab label="Groups" tabId="Groups" />
                    <TabBar.Tab label="Inventory" tabId="Inventory" />
                </StyledTab>

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
