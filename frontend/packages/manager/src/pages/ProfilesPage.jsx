import React, {useContext} from 'react';
import ProfilePanel from "../components/profiles/ProfilePanel"
import AddProfileModal from "../components/profiles/AddProfileModal"
import ProfilesList from "../components/profiles/ProfilesList";

function ProfilesPage(){

    return (
        <div>
            <AddProfileModal />
            <ProfilesList />
        </div>
    );
}

export default ProfilesPage;
