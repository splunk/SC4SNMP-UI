import React, {useState, useContext, useEffect} from 'react';
import Select from "@splunk/react-ui/Select";
import Trash from '@splunk/react-icons/Trash';
import Pencil from '@splunk/react-icons/Pencil';
import Paginator from "@splunk/react-ui/Paginator";
import Table from "@splunk/react-ui/Table";
import { createDOMID } from '@splunk/ui-utils/id';
import Button from "@splunk/react-ui/Button";
import axios from "axios";
import ProfileContext from "../../store/profile-contxt";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import {backendHost} from "../../host";
import {Pagination} from "../../styles/groups/GroupsStyle";
import DeleteModal from "../DeleteModal";
import P from "@splunk/react-ui/Paragraph";


function getExpansionRow(row) {
    return (
        <Table.Row key={`${row._id}-expansion`}>
            <Table.Cell>{/* Empty cell */}</Table.Cell>
            <Table.Cell>{/* Empty cell */}</Table.Cell>
            <Table.Cell>{/* Empty cell */}</Table.Cell>
            <Table.Cell>{row.conditions.field}</Table.Cell>
            <Table.Cell>{row.conditions.patterns && row.conditions.patterns.map(value =>
                                <P key={createDOMID()}>{value.pattern}</P>)}</Table.Cell>
            <Table.Cell>
                {row.varBinds.map((value) => (
                    <P style={{height: "20px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"}} key={createDOMID()}>{value.family}</P>
                ))}
            </Table.Cell>

            <Table.Cell>
                {row.varBinds.map((value) => (
                    <P style={{height: "20px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"}} key={createDOMID()}>{value.category}</P>
                ))}
            </Table.Cell>

            <Table.Cell>
                {row.varBinds.map((value) => (
                    <P style={{height: "20px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"}} key={createDOMID()}>{value.index}</P>
                ))}
            </Table.Cell>

            <Table.Cell />
        </Table.Row>
    );
}

function ProfilesList() {

    const columns = [
        {sortKey: 'profileName', label: 'Profile name'},
        {sortKey: 'frequency', label: 'Frequency'},
        {sortKey: 'condition', label: 'Condition'},
        {sortKey: 'field', label: 'Field'},
        {sortKey: 'patterns', label: 'Patterns'},
        {sortKey: `mibFamily`, label: 'MIB family'},
        {sortKey: `mibCategory`, label: 'MIB category'},
        {sortKey: `index`, label: 'Index'},
        {sortKey: `actions`, label: 'Actions'},
    ];

    const [profilesPerPage, setProfilesPerPage] = useState('3');
    const [pageNum, setPageNum] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [profilesRecords, setProfilesRecords] = useState([]);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const ProfCtx = useContext(ProfileContext);
    const ErrCtx = useContext(ErrorsModalContext);

    const getProfileRows = (page) => {
        const urlCount = `http://${backendHost}/profiles/count`;
        axios.get(urlCount)
            .then((response) => {
                let maxPages = Math.ceil(response.data/Number(profilesPerPage));
                if (maxPages === 0) maxPages = 1;
                if (page > maxPages){
                    page = maxPages;
                };
                const urlGet = `http://${backendHost}/profiles/${page.toString()}/${profilesPerPage.toString()}`;
                axios.get(urlGet)
                    .then((response2) => {
                        setPageNum(page);
                        setTotalPages(maxPages);
                        setProfilesRecords(response2.data);
                    })
            });
    };

    useEffect(() => {
        let isMounted = true;
        console.log(`backend host address: ${backendHost}`);

        // delete below get
        const urlGet = `http://${backendHost}/test`;
        axios.get(urlGet)
                    .then((response) => {
                        console.log(response);
                    })
        getProfileRows(pageNum);
        return () => { isMounted = false }
    }, [ProfCtx.profilesChange]);

    const profilesPerPageHandler = (e, { value }) => {
        setProfilesPerPage(value);
        setPageNum(1);
        ProfCtx.makeProfilesChange();
    };

    const paginationHandler = (page) => {
        getProfileRows(page);
    };

    const profileEditHandler = (row) => {
        ProfCtx.setProfileId(row._id);
        ProfCtx.setProfileName(row.profileName);
        ProfCtx.setFrequency(row.frequency);
        ProfCtx.setVarBinds(row.varBinds);
        ProfCtx.setConditions(row.conditions);
        ProfCtx.setIsEdit(true);
        ProfCtx.setAddOpen(true);
    };

    const profileDeleteHandler = (row) => {
        ProfCtx.setProfileId(row._id);
        ProfCtx.setProfileName(row.profileName);
        ProfCtx.setDeleteOpen(true);
    };

    const deleteModalRequest = () => {
        axios.post(`http://${backendHost}/profiles/delete/${ProfCtx.profileId}`)
          .then(function (response) {
            if ('message' in response.data){
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(response.data.message);
            }
            ProfCtx.makeProfilesChange();
          })
          .catch(function (error) {
            console.log(error);
            ProfCtx.makeProfilesChange();
          });
        ProfCtx.setDeleteOpen(false);
        ProfCtx.addModalToggle?.current?.focus();
    };

    const handleRowExpansion = (rowId) => {
        if (expandedRowId === rowId) {
            setExpandedRowId(null);
        } else {
            setExpandedRowId(rowId);
        }
    };

    return (
        <div style={{width: '100%' }}>
            <Pagination>
                <Select appearance="pill" suffixLabel="profiles per page"
                        value={profilesPerPage} onChange={profilesPerPageHandler}
                        defaultValue="3">
                    <Select.Option label="3" value="3" />
                    <Select.Option label="10" value="10" />
                    <Select.Option label="50" value="50" />
                    <Select.Option label="100" value="100" />
                    <Select.Option label="200" value="200" />
                </Select>
                <Paginator
                    onChange={(event, { page }) => (paginationHandler(page))}
                    current={pageNum}
                    alwaysShowLastPageLink
                    totalPages={totalPages}
                />
            </Pagination>
            <Table stripeRows resizableFillLayout rowExpansion="single">
                <Table.Head>
                    {columns.map((headData) => (
                        <Table.HeadCell key={createDOMID()} width={headData.label === "Actions" ? 100 : "auto"}>
                            {headData.label}
                        </Table.HeadCell>
                    ))}
                </Table.Head>
                <Table.Body>
                    {profilesRecords
                        .map((row) => (
                            <Table.Row
                                key={row._id}
                                expansionRow={getExpansionRow(row)}
                                onExpansion={() => handleRowExpansion(row._id)}
                                expanded={row._id === expandedRowId}
                            >
                                <Table.Cell>{row.profileName}</Table.Cell>
                                <Table.Cell>{row.frequency}</Table.Cell>
                                <Table.Cell>{row.conditions.condition}</Table.Cell>
                                <Table.Cell>{/* Condition field is empty in this view */}</Table.Cell>
                                <Table.Cell>{/* Condition patterns is empty in this view */}</Table.Cell>
                                <Table.Cell>{(row.varBinds.length === 1) ? `1 MIB family` :
                                    `${row.varBinds.length} MIB families`}</Table.Cell>
                                <Table.Cell>{/* MIB category is empty in this view */}</Table.Cell>
                                <Table.Cell>{/* MIB index is empty in this view */}</Table.Cell>
                                <Table.Cell>
                                    <Button onClick={() => profileEditHandler(JSON.parse(JSON.stringify(row)))} icon={<Pencil />} />
                                    <Button onClick={() => profileDeleteHandler(JSON.parse(JSON.stringify(row)))} icon={<Trash />} />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                </Table.Body>
            </Table>
            <DeleteModal deleteName={`${ProfCtx.profileName}`}
                             handleDelete={deleteModalRequest}/>
        </div>
    );
};
/*

*/
export default ProfilesList;
