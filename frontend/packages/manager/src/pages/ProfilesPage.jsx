import React, {useRef, useState, useContext} from 'react';
import ProfilePanel from "../components/profiles/ProfilePanel"
import ProfilesModal from "../components/profiles/ProfilesModal"
import Button from '@splunk/react-ui/Button';
import { DeleteProfileContxtProvider } from "../store/delete-profile-contxt";
import { AddProfileContxtProvider } from "../store/add-profile-contxt";
import AddProfileContext from "../store/add-profile-contxt";

function ProfilesPage(){
    const AddProfCtx = useContext(AddProfileContext);
    const modalToggle = useRef(null);
    const [addOpen, setAddOpen] = useState(false);

    const handleRequestOpen = () => {
        //AddProfCtx.setAddOpen(true);
        setAddOpen(true);
    };

    const handleRequestClose = () => {
        //AddProfCtx.setAddOpen(false);
        setAddOpen(false);
        modalToggle?.current?.focus();
    };

    return (
        <div>
            <AddProfileContxtProvider>
                <DeleteProfileContxtProvider>
                    <Button onClick={handleRequestOpen} ref={modalToggle} label="Add new profile" />
                    <ProfilesModal open={addOpen} handleRequestClose={handleRequestClose} modalToggle={modalToggle}/>
                    <ProfilePanel />
                </DeleteProfileContxtProvider>
            </AddProfileContxtProvider>
        </div>
    );
}

export default ProfilesPage;
