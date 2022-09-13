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
    axios.get('http://127.0.0.1:5000/profiles/all')
    .then((response) => {
        if (isMounted)
            setProfiles(response.data);
    console.log('data: ', response.data);
    })
    return () => { isMounted = false }
    }, [setProfiles]);

    let mappedPatterns = null;
    const profilesPanels = profiles.map((v) => (
        <CollapsiblePanel title={v.profileName}>

            { v.frequency && <P>frequency: {v.frequency}</P> }
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
                                <P>{value.pattern}</P>)}</Table.Cell>
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
        </div>
    );
}

export default ProfilePanel;
