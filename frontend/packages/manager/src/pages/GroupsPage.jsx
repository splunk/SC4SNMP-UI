import React from "react";
import AddGroupModal from "../components/groups/AddGroupModal"
import GroupsList from "../components/groups/GroupsList";

function GroupsPage() {

    return (
        <div style={{ height: "100%"}}>
            <GroupsList/>
            <AddGroupModal />
        </div>
    );
}

export default GroupsPage;
