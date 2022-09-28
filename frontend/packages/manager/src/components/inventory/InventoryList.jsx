import React, {Component, useContext} from 'react';
import Table from '@splunk/react-ui/Table';
import axios from "axios";
import InventoryContext from "../../store/inventory-contxt";
import ButtonsModal from "../ButtonsModal"
import DeleteModal from "../DeleteModal";
import { createDOMID } from '@splunk/ui-utils/id';


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
];


class SortableColumns extends Component {
    static contextType = InventoryContext;

    constructor(props) {
        super(props);

        this.state = {
            sortKey: 'address',
            sortDir: 'asc',
            allInventoryRecords: []
        };

        this.reload = true;
        this.inventoryChange = this.props.inventoryChange;
    }
    url = 'http://127.0.0.1:5000/inventory'
    getFetchInventoryRows() {
        let currentRecords = this.state.allInventoryRecords;
        axios.get(`${this.url}`)
            .then((response) => {
                if (currentRecords.length != response.data.length){
                    this.reload = true;
                }
                this.setState({allInventoryRecords: response.data});
        })
    };

    handleRowClick = (row) => {
        this.context.setButtonsOpen(true);
        this.context.setInventoryId(row._id.$oid);
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
        axios.post(`http://127.0.0.1:5000/inventory/delete/${context.inventoryId}`)
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

    handleSort = (e, {sortKey}) => {
        this.setState((state) => {
            const prevSortKey = state.sortKey;
            const prevSortDir = prevSortKey === sortKey ? state.sortDir : 'none';
            const nextSortDir = prevSortDir === 'asc' ? 'desc' : 'asc';
            return {
                sortKey: sortKey,
                sortDir: nextSortDir,
            };
        });
    };

    componentDidMount() {
        this.getFetchInventoryRows();
    }

    componentDidUpdate() {
        if (this.reload){
            this.reload = false;
            this.getFetchInventoryRows();
        }
    }

    render() {
        if (this.props.inventoryChange != this.inventoryChange){
            this.inventoryChange = this.props.inventoryChange;
            this.reload = true;
        }
        const {sortKey, sortDir, allInventoryRecords} = this.state;
        return (
            <div>
                <Table stripeRows>
                    <Table.Head>
                        {columns.map((headData) => (
                            <Table.HeadCell
                                key={headData.sortKey}
                                onSort={this.handleSort}
                                sortKey={headData.sortKey}
                                sortDir={headData.sortKey === sortKey ? sortDir : 'none'}
                            >
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
                                <Table.Row key={createDOMID()} elementRef={this.context.rowToggle}
                                           onClick={() => this.handleRowClick(JSON.parse(JSON.stringify(row)))}>
                                    <Table.Cell>{row.address}</Table.Cell>
                                    <Table.Cell>{row.port}</Table.Cell>
                                    <Table.Cell>{row.version}</Table.Cell>
                                    <Table.Cell>{row.community}</Table.Cell>
                                    <Table.Cell>{row.secret}</Table.Cell>
                                    <Table.Cell>{row.securityEngine}</Table.Cell>
                                    <Table.Cell>{row.walkInterval}</Table.Cell>
                                    <Table.Cell>{row.profiles.toString()}</Table.Cell>
                                    <Table.Cell>{row.smartProfiles.toString()}</Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table>
                <ButtonsModal handleRequestDelete={() => (this.buttonsRequestDelete(this.context))}
                              handleRequestEdit={() => (this.buttonsRequestEdit(this.context))}
                              context={this.context}/>
                <DeleteModal deleteName={`${this.context.address}:${this.context.port}`}
                             handleDelete={() => (this.deleteModalRequest(this.context))}/>
            </div>
        );
    }
}

export default SortableColumns;
