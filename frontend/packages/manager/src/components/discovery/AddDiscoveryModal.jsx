import React, { useEffect, useState } from 'react';
import Modal from '@splunk/react-ui/Modal';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import ComboBox from '@splunk/react-ui/ComboBox';
import RadioBar from '@splunk/react-ui/RadioBar';
import Button from '@splunk/react-ui/Button';
import P from '@splunk/react-ui/Paragraph';
import { createDOMID } from '@splunk/ui-utils/id';
import api from '../../api';
import { StyledControlGroup, StyledModalBody, StyledModalHeader } from '../../styles/inventory/InventoryStyle';
import { useDiscoveryContext } from '../../store/discovery-contxt';
import { useDiscoveryValidationContext } from '../../store/discovery-validation-contxt';
import { useErrorsModalContext } from '../../store/errors-modal-contxt';
import validateDiscovery, { isLargeSubnet } from '../validation/ValidateDiscovery';
import { validationMessage } from '../../styles/ValidationStyles';

const warningStyle = { color: '#b25f00' };

// Remove UI-only fields and credentials that don't belong to the selected SNMP version.
export const buildPayload = (entry) => {
    const payload = {
        ...entry,
        deviceRules: (entry.deviceRules || []).map(({ name, patterns, group }) => ({ name, patterns, group })),
    };
    if (entry.version === '3') {
        payload.community = '';
    } else {
        payload.secret = '';
        payload.securityEngine = '';
    }
    return payload;
};

function AddDiscoveryModal() {
    const ctx = useDiscoveryContext();
    const validation = useDiscoveryValidationContext();
    const errors = useErrorsModalContext();
    const [groups, setGroups] = useState([]);
    useEffect(() => {
        let active = true;
        api.get('/groups/names').then((response) => {
            if (active) {
                setGroups(response.data || []);
            }
        }).catch(() => {});
        return () => { active = false; };
    }, []);

    const setField = (field, value) => {
        ctx.setEntry((entry) => ({ ...entry, [field]: value }));
        validation.resetErrors(field);
    };
    const setVersion = (version) => {
        ctx.setEntry((entry) => ({
            ...entry,
            version,
            ...(version === '3' ? { community: '' } : { secret: '', securityEngine: '' }),
        }));
        validation.resetErrors('version');
        validation.resetErrors('community');
        validation.resetErrors('secret');
        validation.resetErrors('securityEngine');
    };
    const close = () => {
        validation.resetAllErrors();
        ctx.resetForm();
        ctx.setAddOpen(false);
        ctx.addModalToggle.current?.focus();
    };
    const submit = () => {
        const [valid, fieldErrors] = validateDiscovery(ctx.entry);
        validation.resetAllErrors();
        if (!valid) {
            Object.entries(fieldErrors).forEach(([field, messages]) => validation.setErrors(field, messages));
            return;
        }
        const payload = buildPayload(ctx.entry);
        const request = ctx.isEdit
            ? api.post(`/discovery/update/${ctx.entryId}`, payload)
            : api.post('/discovery/add', payload);
        request.then((response) => {
            if (response.data?.message) {
                errors.setOpen(true); errors.setErrorType('info'); errors.setMessage(response.data.message);
            }
            ctx.makeChange(); close();
        }).catch((error) => {
            errors.setOpen(true); errors.setErrorType('error');
            errors.setMessage(error.response?.data?.message || 'Unable to save Discovery entry.');
        });
    };
    const updateRule = (index, field, value) => {
        const rules = [...ctx.entry.deviceRules];
        rules[index] = { ...rules[index], [field]: value };
        setField('deviceRules', rules);
    };
    const moveRule = (index, offset) => {
        const rules = [...ctx.entry.deviceRules];
        const target = index + offset;
        if (target < 0 || target >= rules.length) {
            return;
        }
        [rules[index], rules[target]] = [rules[target], rules[index]];
        setField('deviceRules', rules);
    };
    const fieldErrors = (field) => (validation.errors[field] || [])
        .map((message) => <P key={message} style={validationMessage}>{message}</P>);
    const input = (field, label, value, props = {}) => (
        <StyledControlGroup label={label} labelWidth={155} key={field}>
            <Text data-test={`sc4snmp:discovery:${field}-input`} value={value}
                  onChange={(e, { value: next }) => setField(field, next)} {...props} />
            {fieldErrors(field)}
        </StyledControlGroup>
    );
    const rules = ctx.entry.deviceRules || [];
    const network = ctx.entry.networkAddress || '';

    return <Modal open={ctx.addOpen} onRequestClose={close} returnFocus={ctx.addModalToggle} style={{ width: '760px' }}>
        <StyledModalHeader title={ctx.isEdit ? 'Edit discovery' : 'Add discovery'} />
        <StyledModalBody>
            {input('name', 'Name', ctx.entry.name, { disabled: ctx.isEdit })}
            {input('networkAddress', 'Network address', network, { placeholder: '10.0.0.0/24' })}
            {network.includes(':') && <P data-test="sc4snmp:discovery:ipv6-hint">IPv6 networks are skipped unless ipv6Enabled is enabled in Helm values.</P>}
            {isLargeSubnet(network) && <P style={warningStyle} data-test="sc4snmp:discovery:large-subnet-warning">
                This is a very large network. Scanning it can take a long time and generate a lot of SNMP traffic.
            </P>}
            <StyledControlGroup label="SNMP version" labelWidth={155}>
                <Select data-test="sc4snmp:discovery:version-select" value={ctx.entry.version} onChange={(e, { value }) => setVersion(value)}>
                    <Select.Option label="1" value="1" /><Select.Option label="2c" value="2c" /><Select.Option label="3" value="3" />
                </Select>
            </StyledControlGroup>
            {input('port', 'Port', ctx.entry.port, { inputMode: 'numeric' })}
            {ctx.entry.version !== '3' && input('community', 'Community', ctx.entry.community)}
            {ctx.entry.version === '3' && <>
                {input('secret', 'Secret', ctx.entry.secret)}
                {input('securityEngine', 'Security engine', ctx.entry.securityEngine)}
                <P>The secret name must also be listed in discovery.usernameSecrets in Helm values.</P>
            </>}
            {input('frequency', 'Frequency (seconds)', ctx.entry.frequency, { inputMode: 'numeric' })}
            <StyledControlGroup label="Delete old results" labelWidth={155}>
                <RadioBar value={String(ctx.entry.deleteAlreadyDiscovered)} onChange={(e, { value }) => setField('deleteAlreadyDiscovered', value === 'true')}>
                    <RadioBar.Option value="true" label="Yes" /><RadioBar.Option value="false" label="No" />
                </RadioBar>
            </StyledControlGroup>
            <P>Device rules are evaluated from top to bottom. Devices that match no rule use the default group. Groups can be selected from existing ones or typed in.</P>
            {rules.map((rule, index) => <div key={rule.id || index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Text data-test="sc4snmp:discovery:rule-name" aria-label="Rule name" placeholder="Name" value={rule.name} onChange={(e, { value }) => updateRule(index, 'name', value)} />
                <Text data-test="sc4snmp:discovery:rule-patterns" aria-label="Rule pattern" placeholder="sysDescr pattern" value={rule.patterns} onChange={(e, { value }) => updateRule(index, 'patterns', value)} />
                <ComboBox data-test="sc4snmp:discovery:rule-group" placeholder="Group name" value={rule.group} onChange={(e, { value }) => updateRule(index, 'group', value)}>
                    {groups.map((group) => <ComboBox.Option key={group} value={group} />)}
                </ComboBox>
                <Button data-test="sc4snmp:discovery:rule-up" aria-label="Move rule up" label="↑" disabled={index === 0} onClick={() => moveRule(index, -1)} />
                <Button data-test="sc4snmp:discovery:rule-down" aria-label="Move rule down" label="↓" disabled={index === rules.length - 1} onClick={() => moveRule(index, 1)} />
                <Button data-test="sc4snmp:discovery:rule-remove" label="Remove rule" onClick={() => setField('deviceRules', rules.filter((_, i) => i !== index))} />
            </div>)}
            {fieldErrors('deviceRules')}
            <Button data-test="sc4snmp:discovery:add-rule" label="Add rule" onClick={() => setField('deviceRules', [...rules, { id: createDOMID(), name: '', patterns: '', group: '' }])} />
        </StyledModalBody>
        <Modal.Footer>
            <Button data-test="sc4snmp:discovery:cancel" appearance="secondary" label="Cancel" onClick={close} />
            <Button data-test="sc4snmp:discovery:submit" appearance="primary" label={ctx.isEdit ? 'Save' : 'Add'} onClick={submit} />
        </Modal.Footer>
    </Modal>;
}

export default AddDiscoveryModal;
