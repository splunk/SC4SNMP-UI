import React, {Component} from 'react';
import Table from '@splunk/react-ui/Table';
import axios from "axios";


const columns = [
    {sortKey: 'address', label: 'Address'},
    {sortKey: 'port', label: 'Port'},
    {sortKey: 'version', label: 'Version'},
    {sortKey: 'community', label: 'Community'},
    {sortKey: 'secret', label: 'Secret'},
    {sortKey: 'securityEngine', label: 'Security Engine'},
    {sortKey: 'walk_interval', label: 'Walk Interval'},
    {sortKey: 'profiles', label: 'Profiles'},
    {sortKey: 'smart_profiles', label: 'Smart Profiles'},
];


class SortableColumns extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sortKey: 'address',
            sortDir: 'asc',
            allInventoryRecords: []
        };
    }
    url = 'http://localhost:5000/inventory'
    getFetchInventoryRows() {
        axios.get(`${this.url}`)
            .then((response) => {
                console.log('response.data: ', response.data);
                this.setState({allInventoryRecords: response.data});
                console.log('inventory : ', this.state);
        })
    }

    componentDidMount() {
        console.log('componentDidMount');
        this.getFetchInventoryRows();
        console.log('inventory: ', this.state);
    }

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

    render() {
        const {sortKey, sortDir, allInventoryRecords} = this.state;
        return (
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
                            <Table.Row key={row.address + row.port}>
                                <Table.Cell>{row.address}</Table.Cell>
                                <Table.Cell>{row.port}</Table.Cell>
                                <Table.Cell>{row.version}</Table.Cell>
                                <Table.Cell>{row.community}</Table.Cell>
                                <Table.Cell>{row.secret}</Table.Cell>
                                <Table.Cell>{row.securityEngine}</Table.Cell>
                                <Table.Cell>{row.walk_interval}</Table.Cell>
                                <Table.Cell>{row.profiles.toString()}</Table.Cell>
                                <Table.Cell>{row.smart_profiles.toString()}</Table.Cell>
                            </Table.Row>
                        ))}
                </Table.Body>
            </Table>
        );
    }
}

export default SortableColumns;
