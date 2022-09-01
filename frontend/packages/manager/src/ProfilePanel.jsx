import React, {useEffect, useState} from 'react';
import CollapsiblePanel from '@splunk/react-ui/CollapsiblePanel';
import P from '@splunk/react-ui/Paragraph';
import axios from "axios";
import Table from "@splunk/react-ui/Table";
import { createDOMID } from '@splunk/ui-utils/id';

function ProfilePanel() {

    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
    let isMounted = true;
    console.log('use effect')
    axios.get('http://localhost:5000/profiles/all')
    .then((response) => {
        if (isMounted)
            setProfiles(response.data);
    console.log('data: ', response.data);
    })
    return () => { isMounted = false }
    }, [setProfiles]);

    const profilesPanels = profiles.map((v) => (
        <CollapsiblePanel title={v.profileName}>

            { v.frequency && <P>frequency: {v.frequency}</P> }
            { v.conditions && <P>conditions: {v.conditions.toString()}</P> }
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
        </div>
    );
}

export default ProfilePanel;
