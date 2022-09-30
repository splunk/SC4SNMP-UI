import React, {useState, useContext, useEffect} from 'react';
import P from '@splunk/react-ui/Paragraph';
import GroupContext from "../../store/group-contxt";
import ButtonsContext from "../../store/buttons-contx";
import axios from "axios";
import CollapsiblePanel from '@splunk/react-ui/CollapsiblePanel';
import Table from "@splunk/react-ui/Table";
import { createDOMID } from '@splunk/ui-utils/id';
import Button from '@splunk/react-ui/Button';
import AddDeviceModal from "./AddDeviceModal";
import ButtonsModal from "../ButtonsModal";
import DeleteModal from "../DeleteModal";
import Paginator from '@splunk/react-ui/Paginator';
import Select from '@splunk/react-ui/Select';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import { backendHost } from "../../host";


function GroupsList() {
    const [groups, setGroups] = useState([]);
    const [openedGroups, setOpenedGroups] = useState({});
    const GrCtx = useContext(GroupContext);
    const BtnCtx = useContext(ButtonsContext);
    const [totalPages, setTotalPages] = useState(1);
    const [openedGroupId, setOpenedGroupId] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [devicesPerPage, setDevicesPerPage] = useState('3');
    const DEVICES_PER_PAGE = 3;

    useEffect(() => {
        let isMounted = true;
        axios.get(`http://${backendHost}/groups`)
        .then((response) => {
            if (isMounted){
                setGroups(response.data);
                let existingGroups = [];
                let opened = {};
                for (let group of response.data){
                    opened[group._id.$oid] = false;
                    existingGroups.push(group._id.$oid);
                }
                // If page was reloaded after updating one of devices, open tab of that group
                if (GrCtx.editedGroupId && existingGroups.includes(GrCtx.editedGroupId)){
                    openCollapsible(GrCtx.editedGroupId, pageNum);
                }else{
                    setOpenedGroups(opened);
                }
            }
        });
        GrCtx.setEditedGroupId(null);
        return () => { isMounted = false }
    }, [GrCtx.groupsChange]);

    useEffect(() => {
        setPageNum(1);
    }, [openedGroupId]);

    const editGroupButtonHandler = (groupId, groupName) => {
        GrCtx.setGroupId(groupId);
        GrCtx.setGroupName(groupName);
        GrCtx.setIsGroupEdit(true);
        GrCtx.setAddGroupOpen(true);
    };

    const newDeviceButtonHandler = (groupId, groupName) => {
        GrCtx.setGroupId(groupId);
        GrCtx.setGroupName(groupName);
        GrCtx.setVersion("");
        GrCtx.setPort(0);
        GrCtx.setIsDeviceEdit(false);
        GrCtx.setAddDeviceOpen(true);
        GrCtx.resetDevice();
    };

    const deleteGroupButtonHandler = (groupId, groupName) => {
        BtnCtx.setDeleteOpen(true);
        GrCtx.setDeleteName(groupName);
        GrCtx.setDeleteUrl(`http://${backendHost}/groups/delete/${groupId}`);
    };

    const openCollapsible = (groupId, page) => {
        setOpenedGroupId(groupId)
        const opened = {};
        opened[groupId] = true;
        setOpenedGroups(prev => {
            for (const prop in prev){
                prev[prop] = false;
            }
            return {...prev, ...opened}}
        );

        // If last item from from current page was deleted, page variable
        // must be decreased. To do this first we calculate current number
        // of pages and then we load devices for this page.
        axios.get(`http://${backendHost}/group/${groupId}/devices/count`)
            .then((response) => {
                let maxPages = Math.ceil(response.data/Number(devicesPerPage));
                if (maxPages === 0) maxPages = 1;
                if (page > maxPages){
                    page = maxPages;
                };
                axios.get(`http://${backendHost}/group/${groupId}/devices/${page}/${devicesPerPage.toString()}`)
                    .then((response2) => {
                        GrCtx.setDevices(response2.data);
                        setPageNum(page);
                        setTotalPages(maxPages);
                    })
            });
    }

    const closeCollapsible = (groupId) => {
        const opened = {};
        opened[groupId] = false;
        setOpenedGroups(prev => {return {...prev, ...opened}});
        GrCtx.setDevices([]);
    }

    const handleRowClick = (row, groupId) => {
        GrCtx.setButtonsOpen(true);
        GrCtx.setIsDeviceEdit(true);
        GrCtx.setDeleteName(`${row.address}:${row.port}`)
        GrCtx.setGroupId(groupId);
        GrCtx.setDeviceId(row._id.$oid);
        GrCtx.setAddress(row.address);
        GrCtx.setPort(row.port);
        GrCtx.setVersion(row.version);
        GrCtx.setCommunity(row.community);
        GrCtx.setSecret(row.secret);
        GrCtx.setSecurityEngine(row.securityEngine);
    };

    const handlePagination = (page, groupId) => {
        openCollapsible(groupId, page);
    };

    const handleDevicesPerPage = (e, { value }) => {
        setDevicesPerPage(value);
        setPageNum(1);
        GrCtx.makeGroupsChange();
    };

    const buttonsRequestDeleteDevice = (context) => {
        context.setButtonsOpen(false);
        context.setDeleteUrl(`http://${backendHost}/devices/delete/${GrCtx.deviceId}`)
        context.setDeleteOpen(true);
    };

    const buttonsRequestEditDevice = (context) => {
        context.setButtonsOpen(false);
        context.setAddDeviceOpen(true);
    };

    const deleteModalRequest = (context) => {
        axios.post(context.deleteUrl)
          .then(function (response) {
            console.log(response);
            context.makeGroupsChange();
          })
          .catch(function (error) {
            console.log(error);
            context.makeGroupsChange();
          });
        context.setDeleteOpen(false);
        context.resetDevice();
        context.setDeleteUrl('');
        context.setEditedGroupId(GrCtx.groupId)
        context.addGroupModalToggle?.current?.focus();
    };

    const groupsList = groups.map((group) => (
        <CollapsiblePanel title={group.groupName} key={createDOMID()} open={openedGroups[group._id.$oid]} onRequestOpen={() => {openCollapsible(group._id.$oid, 1, DEVICES_PER_PAGE)}}
          onRequestClose={() => {closeCollapsible(group._id.$oid)}}>
            <Button onClick={() => (newDeviceButtonHandler(group._id.$oid, group.groupName))} label="Add new device"/>
            <Button onClick={() => (editGroupButtonHandler(group._id.$oid, group.groupName))} label="Edit group name"/>
            <Button onClick={() => (deleteGroupButtonHandler(group._id.$oid, group.groupName))} label="Delete group"/>
            <Table stripeRows>
                <Table.Head>
                    <Table.HeadCell>Address</Table.HeadCell>
                    <Table.HeadCell>Port</Table.HeadCell>
                    <Table.HeadCell>Community</Table.HeadCell>
                    <Table.HeadCell>Secret</Table.HeadCell>
                    <Table.HeadCell>Version</Table.HeadCell>
                    <Table.HeadCell>Security Engine</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {GrCtx.devices.map((row) => (
                        <Table.Row key={createDOMID()} onClick={() => handleRowClick(JSON.parse(JSON.stringify(row)), group._id.$oid)}>
                            <Table.Cell>{row.address}</Table.Cell>
                            <Table.Cell>{row.port}</Table.Cell>
                            <Table.Cell>{row.community}</Table.Cell>
                            <Table.Cell>{row.secret}</Table.Cell>
                            <Table.Cell>{row.version}</Table.Cell>
                            <Table.Cell>{row.securityEngine}</Table.Cell>
                        </Table.Row>
                    ))}

                </Table.Body>
            </Table>
            <Paginator
                onChange={(event, { page }) => (handlePagination(page, group._id.$oid))}
                current={pageNum}
                alwaysShowLastPageLink
                totalPages={totalPages}
            />
        </CollapsiblePanel>
    ))

    return (
        <div>
            <ControlGroup label={"Number of devices per page"} labelPosition="top">
                <Select value={devicesPerPage} onChange={handleDevicesPerPage} defaultValue={"3"}>
                    <Select.Option label="3" value="3" />
                    <Select.Option label="10" value="10" />
                    <Select.Option label="50" value="50" />
                    <Select.Option label="100" value="100" />
                    <Select.Option label="200" value="200" />
                </Select>
            </ControlGroup>
            {groupsList}
            <AddDeviceModal />
            <ButtonsModal handleRequestDelete={() => (buttonsRequestDeleteDevice(GrCtx))}
                              handleRequestEdit={() => (buttonsRequestEditDevice(GrCtx))}
                              context={GrCtx}/>
            <DeleteModal deleteName={GrCtx.deleteName}
                             handleDelete={() => (deleteModalRequest(GrCtx))}/>

        </div>
    );
}

export default GroupsList;
