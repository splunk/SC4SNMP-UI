import React, {useContext} from 'react';
import ProfilePanel from "../components/profiles/ProfilePanel"
import AddProfileModal from "../components/profiles/AddProfileModal"
import Button from '@splunk/react-ui/Button';
import ProfileContext from "../store/profile-contxt";

function ProfilesPage(){

    return (
        <div>
            <AddProfileModal />
            <ProfilePanel />
        </div>
    );
}

export default ProfilesPage;
