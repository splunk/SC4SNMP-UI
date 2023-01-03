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
import ErrorsModalContext from "../../store/errors-modal-contxt";
import Plus from '@splunk/react-icons/Plus';
import Trash from '@splunk/react-icons/Trash';
import Pencil from '@splunk/react-icons/Pencil';
import { GroupsContent, GroupsNames, GroupsNamesHeader, SingleGroup, GroupDevices } from "../../styles/groups/GroupsStyle";



function GroupsList() {
    const [groups, setGroups] = useState([]);
    const [openedGroups, setOpenedGroups] = useState({});
    const GrCtx = useContext(GroupContext);
    const BtnCtx = useContext(ButtonsContext);
    const ErrCtx = useContext(ErrorsModalContext);
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
                    opened[group._id] = false;
                    existingGroups.push(group._id);
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

    const handleRequestOpenGroups = () => {
        GrCtx.setAddGroupOpen(true);
        GrCtx.setIsGroupEdit(false);
        GrCtx.setGroupName('');
        GrCtx.setGroupId(null);
    };

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
        GrCtx.setDeviceId(row._id);
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
            if ('message' in response.data){
                ErrCtx.setOpen(true);
                ErrCtx.setMessage(response.data.message);
            }
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
        <SingleGroup key={createDOMID()}>
            <P>
                {group.groupName}
            </P>
            <div>
                <Button style={{ margin: "0" }} onClick={() => console.log("dodaj device")} appearance="pill" icon={<Plus />} />
                <Button style={{ margin: "0" }} onClick={() => (editGroupButtonHandler(group._id, group.groupName))} appearance="pill" icon={<Pencil />} />
                <Button style={{ margin: "0" }} onClick={() => (deleteGroupButtonHandler(group._id, group.groupName))} appearance="pill" icon={<Trash />} />
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
                TEST
            </GroupDevices>
        </GroupsContent>
    );
}

export default GroupsList;
