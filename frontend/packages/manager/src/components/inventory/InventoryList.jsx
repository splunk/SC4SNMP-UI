import React, {Component, useContext, useState} from 'react';
import Table from '@splunk/react-ui/Table';
import axios from "axios";
import InventoryContext from "../../store/inventory-contxt";
import DeleteModal from "../DeleteModal";
import { createDOMID } from '@splunk/ui-utils/id';
import Paginator from '@splunk/react-ui/Paginator';
import Select from '@splunk/react-ui/Select';
import { backendHost } from "../../host";
import Trash from '@splunk/react-icons/Trash';
import Pencil from '@splunk/react-icons/Pencil';
import Button from '@splunk/react-ui/Button';
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


class SortableColumns extends Component {
    static contextType = InventoryContext;

    constructor(props) {
        super(props);

        this.state = {
            allInventoryRecords: [],
            pageNum: 1,
            totalPages: 1,
            devicesPerPage: "3",
        };

        this.reload = true;
        this.BASE_URL_GET_ALL = `http://${backendHost}/inventory/`
        this.BASE_URL_DELETE = `http://${backendHost}/inventory/delete/`
        this.inventoryChange = this.props.inventoryChange;
    }

    getFetchInventoryRows(page) {
        let currentRecords = this.state.allInventoryRecords;
        const urlCount = this.BASE_URL_GET_ALL+"count"
        axios.get(urlCount)
            .then((response) => {
                let maxPages = Math.ceil(response.data/Number(this.state.devicesPerPage));
                if (maxPages === 0) maxPages = 1;
                if (page > maxPages){
                    page = maxPages;
                };
                const urlGet = this.BASE_URL_GET_ALL+page.toString()+"/"+this.state.devicesPerPage.toString()
                axios.get(urlGet)
                    .then((response2) => {
                        this.setState({allInventoryRecords: response2.data, pageNum: page, totalPages: maxPages})
                    })
            });
    };

    handleRowClick = (row) => {
        this.context.setButtonsOpen(true);
        this.context.setInventoryId(row._id);
        this.context.setAddress(row.address);
        this.context.setPort(row.port);
        this.context.setVersion(row.version);
        this.context.setCommunity(row.community);
        this.context.setSecret(row.secret);
        this.context.setSecurityEngine(row.securityEngine);
        this.context.setWalkInterval(row.walkInterval);
        this.context.setProfiles(row.profiles);
        this.context.setSmartProfiles(row.smartProfiles);
    };

    setRowData = (row) => {
        this.context.setInventoryId(row._id);
        this.context.setAddress(row.address);
        this.context.setPort(row.port);
        this.context.setVersion(row.version);
        this.context.setCommunity(row.community);
        this.context.setSecret(row.secret);
        this.context.setSecurityEngine(row.securityEngine);
        this.context.setWalkInterval(row.walkInterval);
        this.context.setProfiles(row.profiles);
        this.context.setSmartProfiles(row.smartProfiles);
    };

    handleEdit = (row) => {
        this.context.setIsEdit(true);
        this.setRowData(row);
        this.context.setAddOpen(true);
    };

    handleDelete = (row) => {
        this.setRowData(row);
        this.context.setDeleteOpen(true);
    };

    buttonsRequestEdit(context) {
       context.setButtonsOpen(false);
       context.setIsEdit(true);
       context.setAddOpen(true);
    };

    buttonsRequestDelete(context) {
        context.setButtonsOpen(false);
        context.setDeleteOpen(true);
    }

    deleteModalRequest(context) {
        let url = this.BASE_URL_DELETE+`${context.inventoryId.toString()}`;
        axios.post(url)
          .then(function (response) {
            console.log(response);
            context.makeInventoryChange();
          })
          .catch(function (error) {
            console.log(error);
            context.makeInventoryChange();
          });
        context.setDeleteOpen(false);
        context.resetFormData();
        context.addModalToggle?.current?.focus();
    };

    handlePagination = (event, { page }) => {
        this.getFetchInventoryRows(page);
    };

    handleDevicesPerPage = (e, { value }) => {
        this.setState({ devicesPerPage: `${value}`, pageNum: 1 });
        this.reload = true;
    };

    componentDidMount() {
        this.getFetchInventoryRows(1);
    }

    componentDidUpdate() {
        if (this.reload){
            this.reload = false;
            this.getFetchInventoryRows(this.state.pageNum);
        }
    }

    render() {
        if (this.props.inventoryChange != this.inventoryChange){
            this.inventoryChange = this.props.inventoryChange;
            this.reload = true;
        }
        const sortKey = this.state.sortKey;
        const sortDir = this.state.sortDir;
        const allInventoryRecords = this.state.allInventoryRecords;

        console.log(this.state)
        return (
            <div style={{width: '100%' }}>
                <Pagination>
                    <Select appearance="pill" suffixLabel="inventory items per page"
                            value={this.state.devicesPerPage} onChange={this.handleDevicesPerPage}
                            defaultValue={"3"}>
                        <Select.Option label="3" value="3" />
                        <Select.Option label="10" value="10" />
                        <Select.Option label="50" value="50" />
                        <Select.Option label="100" value="100" />
                        <Select.Option label="200" value="200" />
                    </Select>
                    <Paginator
                        onChange={this.handlePagination}
                        current={this.state.pageNum}
                        alwaysShowLastPageLink
                        totalPages={this.state.totalPages}
                    />
                </Pagination>
                <Table stripeRows resizableFillLayout>
                    <Table.Head>
                        {columns.map((headData) => (
                            <Table.HeadCell key={createDOMID()} width={headData.label == "Actions" ? 100 : "auto"}>
                                {headData.label}
                            </Table.HeadCell>
                        ))}
                    </Table.Head>
                    <Table.Body>
                        {allInventoryRecords
                            .sort((rowA, rowB) => {
                                if (sortDir === 'asc') {
                                    return rowA[sortKey] > rowB[sortKey] ? 1 : -1;
                                }
                                if (sortDir === 'desc') {
                                    return rowB[sortKey] > rowA[sortKey] ? 1 : -1;
                                }

                                return 0;
                            })
                            .map((row) => (
                                <Table.Row key={createDOMID()} elementRef={this.context.rowToggle}>
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
                                        <Button onClick={() => this.handleEdit(JSON.parse(JSON.stringify(row)))} icon={<Pencil />} />
                                        <Button onClick={() => this.handleDelete(JSON.parse(JSON.stringify(row)))} icon={<Trash />} />
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table>
                <DeleteModal deleteName={`${this.context.address}:${this.context.port}`}
                             handleDelete={() => (this.deleteModalRequest(this.context))}/>
            </div>
        );
    }
}

export default SortableColumns;
