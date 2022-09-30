import React, {useContext, useEffect, useState} from 'react';
import CollapsiblePanel from '@splunk/react-ui/CollapsiblePanel';
import P from '@splunk/react-ui/Paragraph';
import axios from "axios";
import Table from "@splunk/react-ui/Table";
import { createDOMID } from '@splunk/ui-utils/id';
import Button from '@splunk/react-ui/Button';
import ProfileContext from "../../store/profile-contxt";
import DeleteModal from "../DeleteModal";
import { backendHost } from "../../host";

function ProfilePanel() {
    const [profiles, setProfiles] = useState([]);
    const ProfCtx = useContext(ProfileContext);

    useEffect(() => {
    let isMounted = true;
    axios.get(`http://${backendHost}/profiles`)
    .then((response) => {
        if (isMounted)
            setProfiles(response.data);
    })
    return () => { isMounted = false }
    }, [ProfCtx.profilesChange]);

    const editProfileButtonHandler = (profile) => {
        ProfCtx.setProfileId(profile._id.$oid);
        ProfCtx.setProfileName(profile.profileName);
        ProfCtx.setFrequency(profile.frequency);
        ProfCtx.setVarBinds(profile.varBinds);
        ProfCtx.setConditions(profile.conditions);
        ProfCtx.setIsEdit(true);
        ProfCtx.setAddOpen(true);
    };

    const deleteProfileButtonHandler = (id, profileName) => {
        ProfCtx.setProfileId(id);
        ProfCtx.setProfileName(profileName);
        ProfCtx.setDeleteOpen(true);
    };

    const deleteModalRequest = (context) => {
        axios.post(`http://${backendHost}/profiles/delete/${context.profileId}`)
          .then(function (response) {
            console.log(response);
            context.makeProfilesChange();
          })
          .catch(function (error) {
            console.log(error);
            context.makeProfilesChange();
          });
        context.setDeleteOpen(false);
        context.addModalToggle?.current?.focus();
    };

    let mappedPatterns = null;
    const profilesPanels = profiles.map((v) => (
        <CollapsiblePanel title={v.profileName} key={createDOMID()}>
            <Button onClick={() => deleteProfileButtonHandler(v._id.$oid, v.profileName)} ref={ProfCtx.deleteModalToggle} label="Delete profile" />
            <Button onClick={() => editProfileButtonHandler(JSON.parse(JSON.stringify(v)))} label="Edit profile" />

            { v.frequency && <P>Frequency: {v.frequency}</P> }
            { v.conditions &&
                <Table stripeRows>
                    <Table.Head>
                        <Table.HeadCell>Condition</Table.HeadCell>
                        <Table.HeadCell>Field</Table.HeadCell>
                        <Table.HeadCell>Patterns</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        <Table.Row key={createDOMID()}>
                            <Table.Cell>{v.conditions.condition}</Table.Cell>
                            <Table.Cell>{v.conditions.field}</Table.Cell>
                            <Table.Cell>{v.conditions.patterns && v.conditions.patterns.map(value =>
                                <P key={createDOMID()}>{value.pattern}</P>)}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                 </Table>}

            { v.varBinds &&
            <Table stripeRows>
                <Table.Head>
                    <Table.HeadCell>MIB family</Table.HeadCell>
                    <Table.HeadCell>MIB category</Table.HeadCell>
                    <Table.HeadCell>Index</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                {v.varBinds.map((row) => (
                    <Table.Row key={createDOMID()}>
                        <Table.Cell>{row.family}</Table.Cell>
                        <Table.Cell>{row.category}</Table.Cell>
                        <Table.Cell>{row.index}</Table.Cell>
                    </Table.Row>
                ))}
                </Table.Body>
            </Table>
                }

        </CollapsiblePanel>
    ));

    return (
            <div>
                {profilesPanels}
                <DeleteModal deleteName={`${ProfCtx.profileName}`}
                             handleDelete={() => (deleteModalRequest(ProfCtx))}/>
            </div>
    );
}

export default ProfilePanel;
