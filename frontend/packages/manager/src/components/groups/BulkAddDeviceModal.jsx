import React, {useCallback, useContext, useEffect, useState} from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';
import TextArea from '@splunk/react-ui/TextArea';
import RadioBar from '@splunk/react-ui/RadioBar';
import FormRows from '@splunk/react-ui/FormRows';
import { createDOMID } from '@splunk/ui-utils/id';
import P from '@splunk/react-ui/Paragraph';
import Message from '@splunk/react-ui/Message';
import api from "../../api";
import GroupContext from "../../store/group-contxt";
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import { validationMessage } from "../../styles/ValidationStyles";
import { StyledModalBody, StyledModalHeader } from "../../styles/inventory/InventoryStyle";
import { StyledModeSwitch, sectionTitle } from "../../styles/groups/GroupsStyle";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import ValidationGroup from "../validation/ValidationGroup";

// Rows here are entirely local state, not GroupContext / InventoryDevicesValidationContxt -
// that context is single-valued per field and can't represent one error set per grid row.
// Keeping validation errors and save status on the row object itself (rather than a
// separate index-keyed map, as components/profiles/VarBinds.jsx does for its FormRows grid)
// means removing a row is a plain filter, with no index-shifting bookkeeping needed.
const emptyRow = () => ({
    keyID: createDOMID(),
    address: '',
    port: '',
    version: '',
    community: '',
    secret: '',
    securityEngine: '',
    errors: {},
    status: null,
    message: null,
});

const emptySharedConfig = () => ({
    port: '',
    version: '',
    community: '',
    secret: '',
    securityEngine: '',
});

const isBlankRow = (row) => !row.address && !row.port && !row.version
    && !row.community && !row.secret && !row.securityEngine;

// Pure input adapter for the "Addresses + shared config" mode - splits pasted text into
// raw address candidates. Trimming/dedup/blank-and-comment handling lives in expandAddresses
// so the same rules can later be reused for the addresses-only file adapter (Phase 3).
export function parseAddressList(text){
    return (text || '').split(/[\n,]+/);
}

// Turns raw address candidates into complete six-key grid rows, applying the shared SNMP
// config to every address. Drops blanks/#-comments and dedups so a messy paste (or file)
// doesn't produce duplicate or garbage rows in the preview grid.
export function expandAddresses(addresses, sharedConfig){
    const seen = new Set();
    const rows = [];
    addresses.forEach((raw) => {
        const address = (raw || '').trim();
        if (!address || address.startsWith('#') || seen.has(address)){
            return;
        }
        seen.add(address);
        rows.push({
            keyID: createDOMID(),
            address,
            port: sharedConfig.port,
            version: sharedConfig.version,
            community: sharedConfig.community,
            secret: sharedConfig.secret,
            securityEngine: sharedConfig.securityEngine,
            errors: {},
            status: null,
            message: null,
        });
    });
    return rows;
}

function BulkAddDeviceModal(){
    const GrCtx = useContext(GroupContext);
    const ErrCtx = useContext(ErrorsModalContext);
    const [rows, setRows] = useState([emptyRow()]);
    const [mode, setMode] = useState('manual');
    const [pasteText, setPasteText] = useState('');
    const [sharedConfig, setSharedConfig] = useState(emptySharedConfig());

    // Start from a single blank row every time the modal is (re)opened for a group,
    // but leave rows alone while it stays open so a partial-failure retry (see
    // handleApply) doesn't lose the rows the user still needs to fix.
    useEffect(() => {
        if (GrCtx.bulkAddOpen){
            setRows([emptyRow()]);
            setMode('manual');
            setPasteText('');
            setSharedConfig(emptySharedConfig());
        }
    }, [GrCtx.bulkAddOpen]);

    const handleRequestClose = useCallback(() => {
        setRows([emptyRow()]);
        setMode('manual');
        setPasteText('');
        setSharedConfig(emptySharedConfig());
        GrCtx.setBulkAddOpen(false);
    }, [GrCtx]);

    const handleRequestAdd = useCallback(() => {
        setRows((prev) => [...prev, emptyRow()]);
    }, []);

    const handleRequestRemove = useCallback((e, { index }) => {
        setRows((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleRowFieldChange = useCallback((index, field, value) => {
        setRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }, []);

    const handleSharedConfigChange = useCallback((field, value) => {
        setSharedConfig((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Manual mode's lone blank row is meaningless once you're pasting addresses instead -
    // leaving it in place made the grid look like nothing happened after expanding. Drop it
    // on the way into paste mode, and reseed it on the way back if the grid ended up empty.
    const handleModeChange = useCallback((e, { value }) => {
        setMode(value);
        setRows((prev) => {
            if (value === 'paste'){
                return prev.filter((row) => !isBlankRow(row));
            }
            return prev.length === 0 ? [emptyRow()] : prev;
        });
    }, []);

    // Drops still-blank rows (e.g. the single default row left over from manual mode)
    // before appending the expanded addresses, so switching modes doesn't leave a stray
    // empty row in the middle of the preview grid.
    const handleExpandAddresses = useCallback(() => {
        const expanded = expandAddresses(parseAddressList(pasteText), sharedConfig);
        if (expanded.length === 0){
            return;
        }
        setRows((prev) => [...prev.filter((row) => !isBlankRow(row)), ...expanded]);
        setPasteText('');
    }, [pasteText, sharedConfig]);

    const handleApply = useCallback(() => {
        const validated = rows.map((row) => {
            const validationObj = {
                address: row.address,
                port: row.port,
                version: row.version,
                community: row.community,
                secret: row.secret,
                securityEngine: row.securityEngine,
                inGroupConfig: true,
            };
            const [isValid, errors] = validateInventoryAndGroup(validationObj);
            return { ...row, errors, status: isValid ? null : 'invalid', message: null };
        });

        const toSubmit = [];
        validated.forEach((row, index) => {
            if (row.status !== 'invalid'){
                toSubmit.push({ row, index });
            }
        });

        if (toSubmit.length === 0){
            // Nothing valid to send - just surface the inline errors.
            setRows(validated);
            return;
        }

        api.post("/devices/add/bulk", {
            groupId: GrCtx.groupId,
            devices: toSubmit.map(({ row }) => ({
                address: row.address,
                port: row.port,
                version: row.version,
                community: row.community,
                secret: row.secret,
                securityEngine: row.securityEngine,
            })),
        }).then((response) => {
            const { added, results } = response.data;
            results.forEach((result, i) => {
                const target = validated[toSubmit[i].index];
                target.status = result.added ? 'saved' : 'failed';
                target.message = result.message;
            });
            if (added > 0){
                GrCtx.setEditedGroupId(GrCtx.groupId);
                GrCtx.makeGroupsChange();
            }
            const remaining = validated.filter((row) => row.status !== 'saved');
            if (remaining.length === 0){
                handleRequestClose();
            }else{
                setRows(remaining);
            }
        }).catch((error) => {
            setRows(validated);
            ErrCtx.setOpen(true);
            ErrCtx.setErrorType("error");
            ErrCtx.setMessage(error.response.data.message);
        });
    }, [rows, GrCtx, ErrCtx, handleRequestClose]);

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={GrCtx.bulkAddOpen} style={{ width: '900px' }}>
                <StyledModalHeader title={`Add devices in bulk to ${GrCtx.groupName}`} onRequestClose={handleRequestClose} />
                <StyledModalBody>
                    {/* Plain P labels instead of StyledControlGroup: ControlGroup clones its single
                        child and injects labelledBy/labelText/id props that only well-behaved single
                        react-ui form controls consume correctly - RadioBar (a composite of multiple
                        radio inputs) and a plain wrapper div both end up with a <label for> that
                        doesn't match any real element id. */}
                    <P style={sectionTitle}>Mode</P>
                    <StyledModeSwitch data-test="sc4snmp:bulk:mode" value={mode} onChange={handleModeChange}>
                        <RadioBar.Option data-test="sc4snmp:bulk:mode-manual" value="manual" label="Manual grid" />
                        <RadioBar.Option data-test="sc4snmp:bulk:mode-paste" value="paste" label="Address list" />
                    </StyledModeSwitch>
                    {mode === 'paste' ?
                        <div>
                            <P style={sectionTitle}>Addresses</P>
                            <TextArea data-test="sc4snmp:bulk:paste-input" value={pasteText}
                                      onChange={(e, { value }) => setPasteText(value)}
                                      placeholder="One address per line, or comma-separated" rowsMin={4} />
                            <P style={sectionTitle}>Shared config</P>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                <Text data-test="sc4snmp:bulk:shared-port-input" placeholder="Port" value={sharedConfig.port}
                                      onChange={(e, { value }) => handleSharedConfigChange('port', value)} />
                                <Select data-test="sc4snmp:bulk:shared-select-version" prefixLabel="Version" defaultValue={sharedConfig.version} value={sharedConfig.version}
                                        onChange={(e, { value }) => handleSharedConfigChange('version', value)}>
                                    <Select.Option data-test="sc4snmp:bulk:shared-version-from-inventory" label="From inventory" value="" />
                                    <Select.Option data-test="sc4snmp:bulk:shared-version-1" label="1" value="1" />
                                    <Select.Option data-test="sc4snmp:bulk:shared-version-2c" label="2c" value="2c" />
                                    <Select.Option data-test="sc4snmp:bulk:shared-version-3" label="3" value="3" />
                                </Select>
                                <Text data-test="sc4snmp:bulk:shared-community-input" placeholder="Community" value={sharedConfig.community}
                                      onChange={(e, { value }) => handleSharedConfigChange('community', value)} />
                                <Text data-test="sc4snmp:bulk:shared-secret-input" placeholder="Secret" value={sharedConfig.secret}
                                      onChange={(e, { value }) => handleSharedConfigChange('secret', value)} />
                                <Text data-test="sc4snmp:bulk:shared-security-engine-input" placeholder="Security Engine" value={sharedConfig.securityEngine}
                                      onChange={(e, { value }) => handleSharedConfigChange('securityEngine', value)} />
                            </div>
                            <Button data-test="sc4snmp:bulk:expand-button" appearance="secondary" label="Add addresses"
                                    style={{ marginTop: '12px' }} onClick={handleExpandAddresses} />
                        </div> : null}
                    {rows.length === 0 ?
                        <Message data-test="sc4snmp:bulk:empty-grid-hint" appearance="fill" type="warning" style={{ marginTop: '12px' }}>
                            Add at least one device to the grid before submitting - click &quot;Add addresses&quot; above.
                        </Message> : null}
                    <P style={sectionTitle}>Devices list</P>
                    <FormRows onRequestAdd={handleRequestAdd} addLabel="Add row" data-test="sc4snmp:bulk:add-row">
                        {rows.map((row, index) => (
                            <FormRows.Row data-test="sc4snmp:bulk:row" index={index} key={row.keyID} onRequestRemove={handleRequestRemove}
                                          style={{ backgroundColor: index % 2 === 1 ? '#E1E6EB' : '#FFFFFF', paddingTop: '4px', paddingBottom: '4px' }}>
                                <ValidationGroup>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        <Text data-test="sc4snmp:bulk:address-input" placeholder="Address" value={row.address}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'address', value)}
                                              error={!!(row.errors.address && row.errors.address.length)} />
                                        <Text data-test="sc4snmp:bulk:port-input" placeholder="Port" value={row.port}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'port', value)}
                                              error={!!(row.errors.port && row.errors.port.length)} />
                                        <Select data-test="sc4snmp:bulk:select-version" prefixLabel="Version" defaultValue={row.version} value={row.version}
                                                onChange={(e, { value }) => handleRowFieldChange(index, 'version', value)}>
                                            <Select.Option data-test="sc4snmp:bulk:version-from-inventory" label="From inventory" value="" />
                                            <Select.Option data-test="sc4snmp:bulk:version-1" label="1" value="1" />
                                            <Select.Option data-test="sc4snmp:bulk:version-2c" label="2c" value="2c" />
                                            <Select.Option data-test="sc4snmp:bulk:version-3" label="3" value="3" />
                                        </Select>
                                        <Text data-test="sc4snmp:bulk:community-input" placeholder="Community" value={row.community}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'community', value)}
                                              error={!!(row.errors.community && row.errors.community.length)} />
                                        <Text data-test="sc4snmp:bulk:secret-input" placeholder="Secret" value={row.secret}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'secret', value)}
                                              error={!!(row.errors.secret && row.errors.secret.length)} />
                                        <Text data-test="sc4snmp:bulk:security-engine-input" placeholder="Security Engine" value={row.securityEngine}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'securityEngine', value)}
                                              error={!!(row.errors.securityEngine && row.errors.securityEngine.length)} />
                                    </div>
                                    {Object.keys(row.errors).map((field) => (row.errors[field] || []).map((msg) => (
                                        <P data-test="sc4snmp:bulk:row-error" key={createDOMID()} style={validationMessage}>{msg}</P>
                                    )))}
                                    {(row.status === 'failed' && row.message) ?
                                        <P data-test="sc4snmp:bulk:row-error" style={validationMessage}>{row.message}</P> : null}
                                </ValidationGroup>
                            </FormRows.Row>
                        ))}
                    </FormRows>
                </StyledModalBody>
                <Modal.Footer>
                    <Button data-test="sc4snmp:bulk:cancel-button" appearance="secondary" onClick={handleRequestClose} label="Cancel" />
                    <Button data-test="sc4snmp:bulk:submit-button" appearance="primary" label="Submit"
                            disabled={rows.length === 0} onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default BulkAddDeviceModal;
