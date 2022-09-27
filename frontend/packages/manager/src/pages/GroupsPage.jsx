import React, {useContext} from "react";
import AddGroupModal from "../components/groups/AddGroupModal"
import GroupsList from "../components/groups/GroupsList";
import Button from '@splunk/react-ui/Button';
import GroupContext from "../store/group-contxt";

function GroupsPage() {
    const GrCtx = useContext(GroupContext);

    const handleRequestOpen = () => {
        GrCtx.setAddGroupOpen(true);
        GrCtx.setIsGroupEdit(false);
        GrCtx.setGroupName('');
        GrCtx.setGroupID(null);
    };


    return (
        <div>
            <Button onClick={handleRequestOpen} ref={GrCtx.addGroupModalToggle} label="Add new group" />
            <GroupsList/>
            <AddGroupModal />
        </div>
    );
}

export default GroupsPage;
