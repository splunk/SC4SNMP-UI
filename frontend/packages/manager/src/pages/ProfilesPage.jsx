import React, {useRef, useState, useContext} from 'react';
import ProfilePanel from "../components/profiles/ProfilePanel"
import AddProfileModal from "../components/profiles/AddProfileModal"
import Button from '@splunk/react-ui/Button';
import ProfileContext from "../store/profile-contxt";

function ProfilesPage(){
    const ProfCtx = useContext(ProfileContext);
    const modalToggle = useRef(null);
    const [addOpen, setAddOpen] = useState(false);

    const handleRequestOpen = () => {
        ProfCtx.setProfileName("");
        ProfCtx.setFrequency(1);
        ProfCtx.setVarBinds(null);
        ProfCtx.setConditions(null);
        ProfCtx.setAddOpen(true);
        ProfCtx.setIsEdit(false);
    };

    return (
        <div>
            <Button onClick={handleRequestOpen} ref={ProfCtx.addModalToggle} label="Add new profile" />
            <AddProfileModal />
            <ProfilePanel />
        </div>
    );
}

export default ProfilesPage;
