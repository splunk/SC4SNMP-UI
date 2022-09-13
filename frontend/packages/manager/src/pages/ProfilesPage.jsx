import React from 'react';
import ProfilePanel from "../components/profiles/ProfilePanel"
import ProfilesModal from "../components/profiles/ProfilesModal"

function ProfilesPage(){
    return (
        <div>
            <ProfilesModal />
            <ProfilePanel />
        </div>
    );
}

export default ProfilesPage;
