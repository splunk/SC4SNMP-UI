import React, { useState } from 'react';
import Accordion from '@splunk/react-ui/Accordion';
import P from '@splunk/react-ui/Paragraph';
import { lorem } from '@splunk/react-ui/fixtures/text';

const DUMMY_HOSTS = [{address: 0.0.0.0, port: 161, }];

function Controlled() {
    const [openPanelId, setOpenPanelId] = useState(2);

    const handleChange = (e, { panelId: panelValue }) => {
        setOpenPanelId(panelValue);
    };

    return (
        <Accordion openPanelId={openPanelId} onChange={handleChange}>
            <Accordion.Panel panelId={1} title="Panel 1">
                <P>
                    {lorem}
                    {lorem}
                    {lorem}
                </P>
            </Accordion.Panel>
            <Accordion.Panel panelId={2} title="Panel 2">
                <P>{lorem}</P>
            </Accordion.Panel>
            <Accordion.Panel panelId={3} title="Panel 3">
                <P>
                    {lorem}
                    {lorem}
                </P>
            </Accordion.Panel>
        </Accordion>
    );
}

export default Controlled;
