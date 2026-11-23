import React, { useContext, useEffect, useState } from 'react';
import Table from '@splunk/react-ui/Table';
import Paginator from '@splunk/react-ui/Paginator';
import Select from '@splunk/react-ui/Select';
import Button from '@splunk/react-ui/Button';
import { createDOMID } from '@splunk/ui-utils/id';
import Pencil from '@splunk/react-icons/Pencil';
import Trash from '@splunk/react-icons/enterprise/Trash';
import api from '../../api';
import DeleteModal from '../DeleteModal';
import ButtonsContext from '../../store/buttons-contx';
import ErrorsModalContext from '../../store/errors-modal-contxt';
import { useDiscoveryContext } from '../../store/discovery-contxt';
import { Pagination } from '../../styles/inventory/InventoryStyle';
import { RowActions, StyledFramedTable } from '../../styles/common/ListStyles';
import DeviceRulesTable from '../../styles/discovery/DiscoveryStyle';

function DiscoveryList() {
    const ctx = useDiscoveryContext();
    const errorCtx = useContext(ErrorsModalContext);
    const btnCtx = useContext(ButtonsContext);
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [perPage, setPerPage] = useState('20');
    const [deleting, setDeleting] = useState(null);
    const [expandedRowId, setExpandedRowId] = useState(null);

    const showError = (error, fallback) => {
        errorCtx.setOpen(true);
        errorCtx.setErrorType('error');
        errorCtx.setMessage(error.response?.data?.message || fallback);
    };

    const fetchRows = (requestedPage, requestedPerPage) => api.get('/discovery/count').then(({ data: count }) => {
        const maxPages = Math.max(1, Math.ceil(count / Number(requestedPerPage)));
        const currentPage = Math.min(requestedPage, maxPages);
        return api.get(`/discovery/${currentPage}/${requestedPerPage}`).then(({ data }) => {
            setRows(data); setPage(currentPage); setPages(maxPages);
        });
    }).catch((error) => showError(error, 'Unable to load Discovery entries.'));

    // Refetch on mount and after every change, staying on the current page (clamped if it vanished).
    // Changing the page size fetches explicitly in its handler, so perPage is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchRows(page, perPage); }, [ctx.change]);

    const handlePerPage = (e, { value }) => {
        setPerPage(value);
        fetchRows(1, value);
    };

    const edit = (row) => {
        ctx.setEntry({ ...row, deviceRules: (row.deviceRules || []).map((rule) => ({ ...rule, id: createDOMID() })) });
        ctx.setEntryId(row._id); ctx.setIsEdit(true); ctx.setAddOpen(true);
    };
    const askDelete = (row) => {
        setDeleting(row);
        btnCtx.setDeleteOpen(true);
    };
    const remove = () => {
        const target = deleting;
        btnCtx.setDeleteOpen(false);
        if (!target) {
            return undefined;
        }
        return api.post(`/discovery/delete/${target._id}`).then(() => {
            setDeleting(null); ctx.makeChange();
        }).catch((error) => showError(error, 'Unable to delete Discovery entry.'));
    };

    return <div style={{ width: '100%' }}>
        <Pagination>
            <Select data-test="sc4snmp:discovery-pagination" appearance="subtle" suffixLabel="entries per page" value={perPage} onChange={handlePerPage}>
                {[10, 20, 50, 100].map((size) => <Select.Option key={size} label={String(size)} value={String(size)} />)}
            </Select>
            <Paginator onChange={(e, { page: next }) => fetchRows(next, perPage)} current={page} alwaysShowLastPageLink totalPages={pages} />
        </Pagination>
        <StyledFramedTable data-test="sc4snmp:discovery-table" stripeRows resizableFillLayout rowExpansion="single">
            <Table.Head><Table.HeadCell>Name</Table.HeadCell><Table.HeadCell>Network</Table.HeadCell><Table.HeadCell>Version</Table.HeadCell><Table.HeadCell>Port</Table.HeadCell><Table.HeadCell>Community</Table.HeadCell><Table.HeadCell>Secret</Table.HeadCell><Table.HeadCell>Security engine</Table.HeadCell><Table.HeadCell>Frequency</Table.HeadCell><Table.HeadCell>Delete already discovered</Table.HeadCell><Table.HeadCell width={100}>Actions</Table.HeadCell></Table.Head>
            <Table.Body>{rows.map((row) => <Table.Row key={row._id} data-test="sc4snmp:discovery-row"
                expansionRow={<Table.Row><Table.Cell colSpan={10}>
                    {(row.deviceRules || []).length ? <DeviceRulesTable data-test="sc4snmp:discovery-rules-table" aria-label={`Device rules for ${row.name}`}>
                        <thead>
                            <tr>
                                <th scope="col">Rule name</th>
                                <th scope="col">Pattern</th>
                                <th scope="col">Group name</th>
                            </tr>
                        </thead>
                        <tbody>{row.deviceRules.map((rule, index) => <tr key={`${row._id}-${rule.id || index}`} data-test="sc4snmp:discovery-rule-row">
                            <td>{rule.name}</td>
                            <td>{rule.patterns}</td>
                            <td>{rule.group}</td>
                        </tr>)}</tbody>
                    </DeviceRulesTable> : <span>No device rules</span>}
                </Table.Cell></Table.Row>}
                onExpansion={() => setExpandedRowId(expandedRowId === row._id ? null : row._id)}
                expanded={row._id === expandedRowId}>
                    <Table.Cell>{row.name}</Table.Cell><Table.Cell>{row.networkAddress}</Table.Cell><Table.Cell>{row.version}</Table.Cell><Table.Cell>{row.port}</Table.Cell><Table.Cell data-test="sc4snmp:discovery-community">{row.community}</Table.Cell><Table.Cell data-test="sc4snmp:discovery-secret">{row.secret}</Table.Cell><Table.Cell data-test="sc4snmp:discovery-security-engine">{row.securityEngine}</Table.Cell><Table.Cell>{row.frequency}</Table.Cell><Table.Cell>{row.deleteAlreadyDiscovered ? 'Yes' : 'No'}</Table.Cell>
                    <Table.Cell><RowActions><Button data-test="sc4snmp:discovery-row-edit" aria-label={`Edit ${row.name}`} icon={<Pencil />} onClick={() => edit(row)} /><Button data-test="sc4snmp:discovery-row-delete" aria-label={`Delete ${row.name}`} icon={<Trash />} onClick={() => askDelete(row)} /></RowActions></Table.Cell>
                </Table.Row>)}</Table.Body>
        </StyledFramedTable>
        <DeleteModal deleteName={deleting?.name || ''} handleDelete={remove} />
    </div>;
}

export default DiscoveryList;
