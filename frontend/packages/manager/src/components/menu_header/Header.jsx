import React, {useCallback, useContext, useLayoutEffect, useRef, useState} from 'react';
import MenuHeaderContxt from '../../store/menu-header-contxt';
import ProfileContext from "../../store/profile-contxt";
import GroupContext from "../../store/group-contxt";
import InventoryContext from "../../store/inventory-contxt";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import AuthContext from "../../store/auth-contxt";
import { StyledHeader, StyledHeaderLeft, StyledHeaderRight } from "../../styles/menu_header/HeaderStyle";
import Button from '@splunk/react-ui/Button';
import Plus from '@splunk/react-icons/Plus';
import P from '@splunk/react-ui/Paragraph';
import api from "../../api";
import RestoreModal from "../inventory/RestoreModal";

function Header(){
    const MenuCtx = useContext(MenuHeaderContxt);
    const ProfCtx = useContext(ProfileContext);
    const GrCtx = useContext(GroupContext);
    const InvCtx = useContext(InventoryContext);
    const ErrCtx = useContext(ErrorsModalContext);
    const authCtx = useContext(AuthContext);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const buttonRowRef = useRef(null);
    const [restoreButtonWidth, setRestoreButtonWidth] = useState(null);

    useLayoutEffect(() => {
        if (buttonRowRef.current) {
            setRestoreButtonWidth(buttonRowRef.current.offsetWidth);
        }
    }, [MenuCtx.activeTabId, authCtx.authEnabled]);

    const handleRequestOpenProfile = () => {
        ProfCtx.setProfileName("");
        ProfCtx.setFrequency(1);
        ProfCtx.setVarBinds([]);
        ProfCtx.setCondition("standard");
        ProfCtx.setConditionField("");
        ProfCtx.setConditionPatterns([]);
        ProfCtx.setConditional([]);
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
        InvCtx.setInventoryType("Host");
        InvCtx.setIsEdit(false);
        InvCtx.resetFormData();
    };

    const handleApplyChanges = () => {
        api.post("/apply-changes")
        .then((response) => {
                if ('message' in response.data){
                    ErrCtx.setOpen(true);
                    ErrCtx.setErrorType("info");
                    ErrCtx.setMessage(response.data.message);
                }
            })
        .catch((error) => {
            console.log(error)
            ErrCtx.setOpen(true);
            ErrCtx.setErrorType("error");
            ErrCtx.setMessage("Error: " + error.response.data.message);
            })
    };

    const handleLogout = () => {
        authCtx.logout();
    };

    const handleRestore = () => {
        api.post("/load-config")
            .then(function (response) {
                ErrCtx.setOpen(true);
                ErrCtx.setErrorType("info");
                ErrCtx.setMessage(response.data.message);
                InvCtx.makeInventoryChange();
            })
            .catch(function (error) {
                ErrCtx.setOpen(true);
                ErrCtx.setErrorType("error");
                ErrCtx.setMessage(error.response?.data?.message || "Failed to restore configuration from section files.");
            });
        setRestoreOpen(false);
    };

    const addButtonLabel = {
        Profiles: "Add profile",
        Groups: "Add group",
        Inventory: "Add device/group"
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
                                Collect SNMP data for Splunk Enterprise, Splunk Enterprise Cloud, and Splunk Infrastructure Monitoring.
                                Make any changes to Profiles, Groups, and Inventory, then select Apply changes.
                                You can only apply changes every 5 minutes.
                            </P>
                        </span>
                    </div>
                </StyledHeaderLeft>
                <StyledHeaderRight>
                    <div>
                        <div ref={buttonRowRef}>
                            <Button data-test="sc4snmp:new-item-button" icon={<Plus screenReaderText={null} />} appearance="primary"
                                    label={addButtonLabel[MenuCtx.activeTabId]}
                                    onClick={addButtonHandler[MenuCtx.activeTabId]}
                                    style={{ fontFamily: "Proxima Nova Sbold" }}/>
                            <Button data-test="sc4snmp:apply-changes-button" label="Apply changes" onClick={handleApplyChanges}
                                    style={{ fontFamily: "Proxima Nova Sbold" }}/>
                            {authCtx.authEnabled && (
                                <Button data-test="sc4snmp:logout-button" appearance="secondary" label="Logout" onClick={handleLogout}
                                        style={{ fontFamily: "Proxima Nova Sbold", marginLeft: "8px" }}/>
                            )}
                        </div>
                        <Button data-test="sc4snmp:restore-config-button"
                                appearance="secondary"
                                onClick={() => setRestoreOpen(true)}
                                label="Restore configuration"
                                style={{ fontFamily: "Proxima Nova Sbold", width: restoreButtonWidth ?? undefined, marginTop: "8px" }}/>
                    </div>
                </StyledHeaderRight>
                <RestoreModal open={restoreOpen} setOpen={setRestoreOpen} handleRestore={handleRestore} />
            </StyledHeader>)
}

export default Header;
