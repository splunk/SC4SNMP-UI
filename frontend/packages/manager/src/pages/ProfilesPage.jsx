import React, {useRef, useState, useContext} from 'react';
import ProfilePanel from "../components/profiles/ProfilePanel"
import AddProfileModal from "../components/profiles/AddProfileModal"
import Button from '@splunk/react-ui/Button';
import { ProfileContxtProvider } from "../store/profile-contxt";

function ProfilesPage(){
    const modalToggle = useRef(null);
    const [addOpen, setAddOpen] = useState(false);

    const handleRequestOpen = () => {
        setAddOpen(true);
    };

    const handleRequestClose = () => {
        setAddOpen(false);
        modalToggle?.current?.focus();
    };

    return (
        <div>
            <ProfileContxtProvider>
                <Button onClick={handleRequestOpen} ref={modalToggle} label="Add new profile" />
                <AddProfileModal open={addOpen} handleRequestClose={handleRequestClose} modalToggle={modalToggle}/>
                <ProfilePanel />
            </ProfileContxtProvider>
        </div>
    );
}

export default ProfilesPage;
