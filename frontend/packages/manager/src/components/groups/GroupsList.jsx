import React, {useState, useContext, useEffect} from 'react';
import P from '@splunk/react-ui/Paragraph';
import Select from '@splunk/react-ui/Select';
import Plus from '@splunk/react-icons/Plus';
import Trash from '@splunk/react-icons/Trash';
import Pencil from '@splunk/react-icons/Pencil';
import Paginator from '@splunk/react-ui/Paginator';
import Button from '@splunk/react-ui/Button';
import Table from "@splunk/react-ui/Table";
import { createDOMID } from '@splunk/ui-utils/id';
import axios from "axios";
import ButtonsContext from "../../store/buttons-contx";
import GroupContext from "../../store/group-contxt";
import ErrorsModalContext from "../../store/errors-modal-contxt";
import AddDeviceModal from "./AddDeviceModal";
import DeleteModal from "../DeleteModal";
import { backendHost } from "../../host";
import { GroupsContent, GroupsNames, GroupsNamesHeader,
    SingleGroup, GroupDevices, Pagination } from "../../styles/groups/GroupsStyle";



function GroupsList() {
    const columns = [
        {sortKey: 'address', label: 'Address'},
        {sortKey: 'port', label: 'Port'},
        {sortKey: 'version', label: 'Version'},
        {sortKey: 'community', label: 'Community'},
        {sortKey: 'secret', label: 'Secret'},
        {sortKey: 'securityEngine', label: 'Security Engine'},
        {sortKey: `actions`, label: 'Actions'},
    ];

    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState({});
    const GrCtx = useContext(GroupContext);
    const BtnCtx = useContext(ButtonsContext);
    const ErrCtx = useContext(ErrorsModalContext);
    const [totalPages, setTotalPages] = useState(1);
    const [openedGroupId, setOpenedGroupId] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [devicesPerPage, setDevicesPerPage] = useState('20');

    useEffect(() => {
        let isMounted = true;
        axios.get(`http://${backendHost}/groups`)
        .then((response) => {
            if (isMounted){
                setGroups(response.data);
                const existingGroups = [];
                const selected = {};
                for (const group of response.data){
                    // eslint-disable-next-line no-underscore-dangle
                    selected[group._id] = false;
                    GrCtx.setDevices([]);
                    // eslint-disable-next-line no-underscore-dangle
                    existingGroups.push(group._id);
                }
                // If page was reloaded after updating one of devices, open tab of that group
                if (GrCtx.editedGroupId && existingGroups.includes(GrCtx.editedGroupId)){
                    selectGroup(GrCtx.editedGroupId, GrCtx.groupName, pageNum);
                }else{
                    setSelectedGroup(selected);
                }
            }
        });
        GrCtx.setEditedGroupId(null);
        return () => { isMounted = false }
    }, [GrCtx.groupsChange]);

    useEffect(() => {
        setPageNum(1);
    }, [openedGroupId]);

    const handleRequestOpenGroups = () => {
        GrCtx.setAddGroupOpen(true);
        GrCtx.setIsGroupEdit(false);
        GrCtx.setGroupName('');
        GrCtx.setGroupId(null);
    };

    const editGroupHandler = (groupId, groupName) => {
        GrCtx.setGroupId(groupId);
        GrCtx.setGroupName(groupName);
        GrCtx.setIsGroupEdit(true);
        GrCtx.setAddGroupOpen(true);
    };

    const newDevicenHandler = (groupId, groupName) => {
        GrCtx.setGroupId(groupId);
        GrCtx.setGroupName(groupName);
        GrCtx.setVersion("");
        GrCtx.setPort(0);
        GrCtx.setIsDeviceEdit(false);
        GrCtx.setAddDeviceOpen(true);
        GrCtx.resetDevice();
    };

    const groupDeleteHandler = (groupId, groupName, groupInInventory) => {
        BtnCtx.setDeleteOpen(true);
        GrCtx.setDeleteName(groupName);
        GrCtx.setDeleteUrl(`http://${backendHost}/groups/delete/${groupId}`);
        if (groupInInventory){
            GrCtx.setGroupWarning(`WARNING: This group is configured in the inventory`);
        }else{
            GrCtx.setGroupWarning(null);
        }
        GrCtx.makeGroupsChange();
    };

    const selectGroup = (groupId, groupName, page) => {
        setOpenedGroupId(groupId)
        GrCtx.setGroupName(groupName);
        const selected = {};
        selected[groupId] = true;
        setSelectedGroup(prev => {
            for (const prop in prev){
                prev[prop] = false;
            }
            return {...prev, ...selected}}
        );
        // If the last item from the current page was deleted, page variable
        // must be decreased. To do this first we calculate current number
        // of pages and then we load devices for this page.
        axios.get(`http://${backendHost}/group/${groupId}/devices/count`)
            .then((response) => {
                let maxPages = Math.ceil(response.data/Number(devicesPerPage));
                if (maxPages === 0) {maxPages = 1;}
                if (page > maxPages){
                    page = maxPages;
                };
                axios.get(`http://${backendHost}/group/${groupId}/devices/${page}/${devicesPerPage.toString()}`)
                    .then((response2) => {
                        GrCtx.setDevices(response2.data);
                        setPageNum(page);
                        setTotalPages(maxPages);
                        let inventoryRecord = {
                                        port: "",
                                        version: "",
                                        community: "",
                                        secret: "",
                                        securityEngine: ""
                                    };
                        axios.get(`http://${backendHost}/group/inventory/${groupName}`)
                            .then((response3) => {
                                if (response3.status === 200){
                                    inventoryRecord = response3.data;
                                    Object.keys(inventoryRecord).forEach((key) => {
                                        if (`${inventoryRecord[key]}`.length > 0){
                                            inventoryRecord[key] = `${inventoryRecord[key]} (from inventory)`;
                                        }else{
                                            inventoryRecord[key] = "";
                                        }
                                    })
                                    GrCtx.setInventoryConfig(inventoryRecord);
                                }else{
                                    GrCtx.setInventoryConfig(inventoryRecord);
                                }
                            })
                            .catch(() => {
                                GrCtx.setInventoryConfig(inventoryRecord);
                            })
                    })
            });
    }

    const paginationHandler = (page, groupId) => {
        selectGroup(groupId, GrCtx.groupName, page);
    };

    const devicesPerPageHandler = (e, { value }) => {
        setDevicesPerPage(value);
        setPageNum(1);
        GrCtx.setEditedGroupId(openedGroupId);
        GrCtx.makeGroupsChange();
    };


    const deviceEditHandler = (row) => {
        GrCtx.setGroupId(openedGroupId);
        GrCtx.setDeviceId(row._id);
        GrCtx.setAddress(row.address);
        GrCtx.setPort(row.port);
        GrCtx.setVersion(row.version);
        GrCtx.setCommunity(row.community);
        GrCtx.setSecret(row.secret);
        GrCtx.setSecurityEngine(row.securityEngine);
        GrCtx.setIsDeviceEdit(true);
        GrCtx.setAddDeviceOpen(true);
    };

    const deviceDeleteHandler = (row) => {
        GrCtx.setDeleteName(`${row.address}:${row.port}`);
        GrCtx.setDeviceId(row._id);
        GrCtx.setGroupId(openedGroupId);
        GrCtx.setDeleteUrl(`http://${backendHost}/devices/delete/${row._id}`)
        GrCtx.setDeleteOpen(true);
    };

    const deleteModalRequest = () => {
        axios.post(GrCtx.deleteUrl)
          .then(function (response) {
            if ('message' in response.data){
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(response.data.message);
            }
            GrCtx.makeGroupsChange();
          })
          .catch(function (error) {
            console.log(error);
            GrCtx.makeGroupsChange();
          });
        GrCtx.setDeleteOpen(false);
        GrCtx.resetDevice();
        GrCtx.setDeleteUrl('');
        GrCtx.setEditedGroupId(GrCtx.groupId)
        GrCtx.addGroupModalToggle?.current?.focus();
    };

    const clickGroupHandler = (event, groupId, groupName, page) => {
        if (event.target === event.currentTarget) {
          selectGroup(groupId, groupName, page);
        }
    };

    const groupsList = groups.map((group, i) => (
        <SingleGroup data-test={`sc4snmp:group-${i}`} onClick={(event) => (clickGroupHandler(event, group._id, group.groupName, 1))} style={{ backgroundColor: (selectedGroup[group._id]) ? "#E1E6EB" : "#FFFFF" }} key={createDOMID()}>
            <P>
                {group.groupName}
            </P>
            <div>
                <Button data-test={`sc4snmp:group-${i}:new-device-button`} style={{ margin: "0" }} onClick={() => (newDevicenHandler(group._id, group.groupName))} appearance="pill" icon={<Plus />} />
                <Button data-test={`sc4snmp:group-${i}:edit-group-button`} style={{ margin: "0" }} onClick={() => (editGroupHandler(group._id, group.groupName))} appearance="pill" icon={<Pencil />} />
                <Button data-test={`sc4snmp:group-${i}:delete-group-button`} style={{ margin: "0" }} onClick={() => (groupDeleteHandler(group._id, group.groupName, group.groupInInventory))} appearance="pill" icon={<Trash />} />
            </div>
        </SingleGroup>
    ));


    return (
        <GroupsContent>
            <GroupsNames>
                <GroupsNamesHeader>
                    <P>Group name</P>
                    <div>
                        <Button onClick={handleRequestOpenGroups} appearance="pill" icon={<Plus />} />
                    </div>
                </GroupsNamesHeader>
                {groupsList}
            </GroupsNames>
            <GroupDevices>
                <div style={{width: '100%' }}>
                    <Pagination>
                        <Select appearance="pill" suffixLabel="inventory items per page"
                                value={devicesPerPage} onChange={devicesPerPageHandler}
                                defaultValue="20">
                            <Select.Option label="10" value="10" />
                            <Select.Option label="20" value="20" />
                            <Select.Option label="50" value="50" />
                            <Select.Option label="100" value="100" />
                        </Select>
                        <Paginator
                            onChange={(event, { page }) => (paginationHandler(page, openedGroupId))}
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
                            {GrCtx.devices
                                .map((row, i) => (
                                    <Table.Row data-test={`sc4snmp:group-row-${i}`} key={createDOMID()} >
                                        <Table.Cell>{row.address}</Table.Cell>
                                        <Table.Cell>{(row.port === '') ? GrCtx.inventoryConfig.port : row.port}</Table.Cell>
                                        <Table.Cell>{(row.version === '') ? GrCtx.inventoryConfig.version  : row.version}</Table.Cell>
                                        <Table.Cell>{(row.community === '') ? GrCtx.inventoryConfig.community  : row.community}</Table.Cell>
                                        <Table.Cell>{(row.secret === '') ? GrCtx.inventoryConfig.secret  : row.secret}</Table.Cell>
                                        <Table.Cell>{(row.securityEngine === '') ? GrCtx.inventoryConfig.securityEngine  : row.securityEngine}</Table.Cell>
                                        <Table.Cell>
                                            <Button data-test={`sc4snmp:group-row-edit-${i}`} onClick={() => deviceEditHandler(JSON.parse(JSON.stringify(row)))} icon={<Pencil />} />
                                            <Button data-test={`sc4snmp:group-row-delete-${i}`} onClick={() => deviceDeleteHandler(JSON.parse(JSON.stringify(row)))} icon={<Trash />} />
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                        </Table.Body>
                    </Table>
                </div>
            </GroupDevices>
            <AddDeviceModal />
            <DeleteModal deleteName={GrCtx.deleteName} customWarning={GrCtx.groupWarning}
                             handleDelete={() => (deleteModalRequest())}/>
        </GroupsContent>
    );
}

export default GroupsList;
