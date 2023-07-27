import React, {useCallback, useEffect} from 'react';
import P from '@splunk/react-ui/Paragraph';
import TabBar from '@splunk/react-ui/TabBar';
import { createBrowserHistory } from "history"
import qs from "qs";
import {useMenuHeaderContxt} from '../../store/menu-header-contxt';
import { StyledTab, StyledMenuBar, StyledMenuBarLeft, StyledMenuBarRight } from "../../styles/menu_header/MenuBarStyle";

function Menu(){
    const MenuCtx = useMenuHeaderContxt();

    const history = createBrowserHistory();

    const handleMenuChange = useCallback((e, { selectedTabId }) => {
        MenuCtx.setActiveTabId(selectedTabId);
    }, []);

    useEffect(() => {
        const filterParams = history.location.search.substring(1);
        const filtersFromParams = qs.parse(filterParams);
        if (filtersFromParams.tab) {
            MenuCtx.setActiveTabId(filtersFromParams.tab);
        }
      }, []);

      useEffect(() => {
        history.push(`?tab=${MenuCtx.activeTabId}`);
      }, [MenuCtx.activeTabId]);

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
