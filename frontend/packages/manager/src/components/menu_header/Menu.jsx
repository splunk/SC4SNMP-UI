import React, {useCallback} from 'react';
import {useMenuHeaderContxt} from '../../store/menu-header-contxt';
import { StyledTab, StyledMenuBar, StyledMenuBarLeft, StyledMenuBarRight } from "../../styles/menu_header/MenuBarStyle";
import P from '@splunk/react-ui/Paragraph';
import TabBar from '@splunk/react-ui/TabBar';

function Menu(){
    const MenuCtx = useMenuHeaderContxt();

    const handleMenuChange = useCallback((e, { selectedTabId }) => {
        MenuCtx.setActiveTabId(selectedTabId);
    }, []);

    return(
            <StyledMenuBar>
                 <StyledMenuBarLeft>
                     <StyledTab activeTabId={MenuCtx.activeTabId} onChange={handleMenuChange}>
                        <TabBar.Tab data-test="sc4snmp:profiles-tab" label="Profiles" tabId="Profiles" />
                        <TabBar.Tab data-test="sc4snmp:groups-tab" label="Groups" tabId="Groups" />
                        <TabBar.Tab data-test="sc4snmp:groups-tab" label="Inventory" tabId="Inventory" />
                    </StyledTab>
                 </StyledMenuBarLeft>
                 <StyledMenuBarRight>
                    <div>
                        <P>
                            Splunk Connect for SNMP
                        </P>
                    </div>
                 </StyledMenuBarRight>
             </StyledMenuBar>
    )
}

export default Menu;
