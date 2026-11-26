import React, { useEffect, useState } from 'react';
import Message from '@splunk/react-ui/Message';
import api from '../api';
import DiscoveryList from '../components/discovery/DiscoveryList';
import AddDiscoveryModal from '../components/discovery/AddDiscoveryModal';

export default function DiscoveryPage() {
    const [enabled, setEnabled] = useState(null);

    useEffect(() => {
        let active = true;
        api.get('/discovery/status')
            .then((response) => { if (active) { setEnabled(response.data?.enabled); } })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    return (
        <div>
            {enabled === false && (
                <Message appearance="fill" type="warning" data-test="sc4snmp:discovery:disabled-banner">
                    Discovery is disabled in Helm values (discovery.enabled). Entries can be edited but will not be
                    applied until it is enabled.
                </Message>
            )}
            <Message appearance="fill" type="info" data-test="sc4snmp:discovery:info">
                Once Discovery is managed in this UI, changes to discovery.autodiscovery in the Helm values or
                ConfigMap are ignored (use Restore to load them from the section files). Changes to an existing
                entry take effect at its next scheduled run.
            </Message>
            <AddDiscoveryModal />
            <DiscoveryList />
        </div>
    );
}
