import React, {useContext} from "react";
import AddGroupModal from "../components/groups/AddGroupModal"
import GroupsList from "../components/groups/GroupsList";
import Button from '@splunk/react-ui/Button';
import GroupContext from "../store/group-contxt";

function GroupsPage() {

    return (
        <div>
            <GroupsList/>
            <AddGroupModal />
        </div>
    );
}

export default GroupsPage;
