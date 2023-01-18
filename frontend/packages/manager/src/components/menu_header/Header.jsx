import React, {useCallback, useContext, useState} from 'react';
import MenuHeaderContxt from '../../store/menu-header-contxt';
import ProfileContext from "../../store/profile-contxt";
import GroupContext from "../../store/group-contxt";
import InventoryContext from "../../store/inventory-contxt";
import { StyledHeader, StyledHeaderLeft, StyledHeaderRight } from "../../styles/menu_header/HeaderStyle";
import Button from '@splunk/react-ui/Button';
import Plus from '@splunk/react-icons/Plus';
import P from '@splunk/react-ui/Paragraph';

function Header(){
    const MenuCtx = useContext(MenuHeaderContxt);
    const ProfCtx = useContext(ProfileContext);
    const GrCtx = useContext(GroupContext);
    const InvCtx = useContext(InventoryContext);

    const handleRequestOpenProfile = () => {
        ProfCtx.setProfileName("");
        ProfCtx.setFrequency(1);
        ProfCtx.setVarBinds(null);
        ProfCtx.setConditions(null);
        ProfCtx.setAddOpen(true);
        ProfCtx.setIsEdit(false);
    };

    const handleRequestOpenGroups = () => {
        GrCtx.setAddGroupOpen(true);
        GrCtx.setIsGroupEdit(false);
        GrCtx.setGroupName('');
        GrCtx.setGroupId(null);
    };

    const handleRequestOpenInventory = () => {
        InvCtx.setAddOpen(true);
        InvCtx.setIsEdit(false);
        InvCtx.resetFormData();
    };

    const handleApplyChanges = () => {
        console.log("Applying changes")
    };

    const addButtonLabel = {
        Profiles: "Add new profile",
        Groups: "Add new group",
        Inventory: "Add new device"
    };

    const addButtonHandler = {
        Profiles: handleRequestOpenProfile,
        Groups: handleRequestOpenGroups,
        Inventory: handleRequestOpenInventory
    };

    return(
            <StyledHeader>
                <StyledHeaderLeft>
                    <div>
                        <span id="project-title">
                            <P>
                                Splunk Connect for SNMP
                            </P>
                        </span>
                        <span id="project-description">
                            <P>
                                Collect SNMP data for Splunk Enterprise, Splunk Enterprise Cloud and Splunk
                                Infrastructure Monitoring. Make any changes to Profiles, Groups and Inventory. Then select
                                Apply changes to put the changes into effect. Applying changes can only be done every
                                5 minutes.
                            </P>
                        </span>
                    </div>
                </StyledHeaderLeft>
                <StyledHeaderRight>
                    <div>
                        <Button icon={<Plus screenReaderText={null} />} appearance="primary"
                                label={addButtonLabel[MenuCtx.activeTabId]}
                                onClick={addButtonHandler[MenuCtx.activeTabId]}
                                style={{ fontFamily: "Proxima Nova Sbold" }}/>
                        <Button label="Apply changes" onClick={handleApplyChanges}
                                style={{ fontFamily: "Proxima Nova Sbold" }}/>
                    </div>
                </StyledHeaderRight>
            </StyledHeader>)
}

export default Header;
