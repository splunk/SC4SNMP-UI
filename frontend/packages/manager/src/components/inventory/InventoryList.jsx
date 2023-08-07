import React, {useContext, useEffect, useState} from 'react';
import Table from '@splunk/react-ui/Table';
import axios from "axios";
import { createDOMID } from '@splunk/ui-utils/id';
import Paginator from '@splunk/react-ui/Paginator';
import Select from '@splunk/react-ui/Select';
import Trash from '@splunk/react-icons/Trash';
import Pencil from '@splunk/react-icons/Pencil';
import Button from '@splunk/react-ui/Button';
import { backendHost } from "../../host";
import DeleteModal from "../DeleteModal";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import InventoryContext from "../../store/inventory-contxt";
import { Pagination } from '../../styles/inventory/InventoryStyle';


const columns = [
    {sortKey: 'address', label: 'Address'},
    {sortKey: 'port', label: 'Port'},
    {sortKey: 'version', label: 'Version'},
    {sortKey: 'community', label: 'Community'},
    {sortKey: 'secret', label: 'Secret'},
    {sortKey: 'securityEngine', label: 'Security Engine'},
    {sortKey: 'walkInterval', label: 'Walk Interval'},
    {sortKey: 'profiles', label: 'Profiles'},
    {sortKey: 'smartProfiles', label: 'Smart Profiles'},
    {sortKey: `actions`, label: 'Actions'},
];


function InventoryList() {
    const InvCtx = useContext(InventoryContext);
    const ErrCtx = useContext(ErrorsModalContext);

    const [allInventoryRecords, setAllInventoryRecords] = useState([]);
    const [pageNum, setPageNum] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [devicesPerPage, setDevicesPerPage] = useState("20");

    const BASE_URL_GET_ALL = `http://${backendHost}/inventory/`;
    const BASE_URL_DELETE = `http://${backendHost}/inventory/delete/`;

    const getFetchInventoryRows = (page) => {
        const urlCount = `${BASE_URL_GET_ALL}count`
        axios.get(urlCount)
            .then((response) => {
                let maxPages = Math.ceil(response.data/Number(devicesPerPage));
                if (maxPages === 0) {maxPages = 1;}
                if (page > maxPages){
                    page = maxPages;
                };
                const urlGet = `${BASE_URL_GET_ALL+page.toString()}/${devicesPerPage.toString()}`
                axios.get(urlGet)
                    .then((response2) => {
                        setAllInventoryRecords(response2.data);
                        setPageNum(page);
                        setTotalPages(maxPages);
                    })
            });
    };

    useEffect(() => {
        getFetchInventoryRows(pageNum);
    }, [InvCtx.inventoryChange]);

    const setRowData = (row) => {
        InvCtx.setInventoryId(row._id);
        InvCtx.setInventoryType(row.inventoryType);
        InvCtx.setAddress(row.address);
        InvCtx.setPort(row.port);
        InvCtx.setVersion(row.version);
        InvCtx.setCommunity(row.community);
        InvCtx.setSecret(row.secret);
        InvCtx.setSecurityEngine(row.securityEngine);
        InvCtx.setWalkInterval(row.walkInterval);
        InvCtx.setProfiles(row.profiles);
        InvCtx.setSmartProfiles(row.smartProfiles);
    };

    const handleEdit = (row) => {
        InvCtx.setIsEdit(true);
        setRowData(row);
        InvCtx.setAddOpen(true);
    };

    const handleDelete = (row) => {
        setRowData(row);
        InvCtx.setDeleteOpen(true);
    };

    const deleteModalRequest = () => {
        const url = `${BASE_URL_DELETE}${InvCtx.inventoryId.toString()}`;
        axios.post(url)
          .then(function (response) {
            if ('message' in response.data){
                ErrCtx.setOpen(true);
                ErrCtx.setErrorType("info");
                ErrCtx.setMessage(response.data.message);
            }
            InvCtx.makeInventoryChange();
          })
          .catch(function (error) {
            console.log(error);
            InvCtx.makeInventoryChange();
          });
        InvCtx.setDeleteOpen(false);
        InvCtx.resetFormData();
        InvCtx.addModalToggle?.current?.focus();
    };

    const handlePagination = (event, { page }) => {
        getFetchInventoryRows(page);
    };

    const handleDevicesPerPage = (e, { value }) => {
        setDevicesPerPage(`${value}`);
        setPageNum(1);
        InvCtx.makeInventoryChange();
    };

    return (
        <div style={{width: '100%' }}>
            <Pagination>
                <Select data-test="sc4snmp:inventory-pagination" appearance="pill" suffixLabel="inventory items per page"
                        value={devicesPerPage} onChange={handleDevicesPerPage}
                        defaultValue="20">
                    <Select.Option data-test="sc4snmp:inventory-pagination-10" label="10" value="10" />
                    <Select.Option data-test="sc4snmp:inventory-pagination-20" label="20" value="20" />
                    <Select.Option data-test="sc4snmp:inventory-pagination-50" label="50" value="50" />
                    <Select.Option data-test="sc4snmp:inventory-pagination-100" label="100" value="100" />
                </Select>
                <Paginator
                    onChange={handlePagination}
                    current={pageNum}
                    alwaysShowLastPageLink
                    totalPages={totalPages}
                />
            </Pagination>
            <Table stripeRows resizableFillLayout>
                <Table.Head>
                    {columns.map((headData) => (
                        <Table.HeadCell key={createDOMID()} width={headData.label === "Actions" ? 100 : "auto"}>
                            {headData.label}
                        </Table.HeadCell>
                    ))}
                </Table.Head>
                <Table.Body>
                    {allInventoryRecords
                        .map((row, i) => (
                            <Table.Row data-test={`sc4snmp:inventory-row-${i}`} key={createDOMID()} elementRef={InvCtx.rowToggle}>
                                <Table.Cell>{row.address}</Table.Cell>
                                <Table.Cell>{row.port}</Table.Cell>
                                <Table.Cell>{row.version}</Table.Cell>
                                <Table.Cell>{row.community}</Table.Cell>
                                <Table.Cell>{row.secret}</Table.Cell>
                                <Table.Cell>{row.securityEngine}</Table.Cell>
                                <Table.Cell>{row.walkInterval}</Table.Cell>
                                <Table.Cell>{row.profiles.toString()}</Table.Cell>
                                <Table.Cell>{row.smartProfiles.toString()}</Table.Cell>
                                <Table.Cell>
                                    <Button data-test={`sc4snmp:inventory-row-edit-${i}`} onClick={() => handleEdit(JSON.parse(JSON.stringify(row)))} icon={<Pencil />} />
                                    <Button data-test={`sc4snmp:inventory-row-delete-${i}`} onClick={() => handleDelete(JSON.parse(JSON.stringify(row)))} icon={<Trash />} />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                </Table.Body>
            </Table>
            <DeleteModal deleteName={`${InvCtx.address}:${InvCtx.port}`}
                         handleDelete={deleteModalRequest}/>
        </div>
    );
}

export default InventoryList;

