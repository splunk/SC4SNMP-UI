import React, {useCallback, useContext, useEffect, useState} from 'react';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';
import FormRows from '@splunk/react-ui/FormRows';
import { createDOMID } from '@splunk/ui-utils/id';
import P from '@splunk/react-ui/Paragraph';
import api from "../../api";
import GroupContext from "../../store/group-contxt";
import validateInventoryAndGroup from "../validation/ValidateInventoryAndGroup";
import { validationMessage } from "../../styles/ValidationStyles";
import { StyledModalBody, StyledModalHeader } from "../../styles/inventory/InventoryStyle";
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

function BulkAddDeviceModal(){
    const GrCtx = useContext(GroupContext);
    const ErrCtx = useContext(ErrorsModalContext);
    const [rows, setRows] = useState([emptyRow()]);

    // Start from a single blank row every time the modal is (re)opened for a group,
    // but leave rows alone while it stays open so a partial-failure retry (see
    // handleApply) doesn't lose the rows the user still needs to fix.
    useEffect(() => {
        if (GrCtx.bulkAddOpen){
            setRows([emptyRow()]);
        }
    }, [GrCtx.bulkAddOpen]);

    const handleRequestClose = useCallback(() => {
        setRows([emptyRow()]);
        GrCtx.setBulkAddOpen(false);
    }, [GrCtx.setBulkAddOpen]);

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
    }, [rows, GrCtx.groupId, GrCtx.setEditedGroupId, GrCtx.makeGroupsChange, handleRequestClose]);

    return (
        <div>
            <Modal onRequestClose={handleRequestClose} open={GrCtx.bulkAddOpen} style={{ width: '900px' }}>
                <StyledModalHeader title={`Add devices in bulk to ${GrCtx.groupName}`} onRequestClose={handleRequestClose} />
                <StyledModalBody>
                    <FormRows onRequestAdd={handleRequestAdd} addLabel="Add row" data-test="sc4snmp:bulk:add-row">
                        {rows.map((row, index) => (
                            <FormRows.Row data-test="sc4snmp:bulk:row" index={index} key={row.keyID} onRequestRemove={handleRequestRemove}>
                                <ValidationGroup>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        <Text data-test="sc4snmp:bulk:address-input" placeholder="Address" value={row.address}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'address', value)}
                                              error={!!(row.errors.address && row.errors.address.length)} />
                                        <Text data-test="sc4snmp:bulk:port-input" placeholder="Port" value={row.port}
                                              onChange={(e, { value }) => handleRowFieldChange(index, 'port', value)}
                                              error={!!(row.errors.port && row.errors.port.length)} />
                                        <Select data-test="sc4snmp:bulk:select-version" defaultValue={row.version} value={row.version}
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
                    <Button data-test="sc4snmp:bulk:submit-button" appearance="primary" label="Submit" onClick={handleApply} />
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default BulkAddDeviceModal;
