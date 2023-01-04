import styled from "styled-components";

const GroupsContent = styled.div`
    display: flex;
    border-top: 1px #2B3033 solid;
    height: 100%;
    width: 100%;
`;

const GroupsNames = styled.div`
    width: 360px;
    border-right: 1px #2B3033 solid;
    min-height: 100%;
    box-sizing: border-box;
`;

const GroupsNamesHeader = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    height: 40px;
    align-items: center;
    padding-left: 16px;
    padding-right: 16px;
    box-sizing: border-box;
    box-shadow: inset 0px -1px 0px #C3CBD4;

    & > p{
        font-family: 'Proxima Nova Bold';
        font-style: normal;
        font-size: 16px;
        line-height: 16px;
        margin-bottom: 0;
    }
`;

const SingleGroup = styled.div`
    width: 100%;
    box-shadow: inset 0px -1px 0px #C3CBD4;
    height: 39px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 16px;
    padding-right: 16px;
    box-sizing: border-box;

    & > p{
        font-family: 'Proxima Nova Bold';
        font-style: normal;
        font-size: 14px;
        line-height: 12px;
        margin-bottom: 0;
    }
`;

const GroupDevices = styled.div`
    width: 100%;
`;

const Pagination = styled.div`
    width: 100%;
    display: flex;
    height: 53px;
    justify-content: space-between;
    align-items: center;
    padding-left: 22px;
    padding-right: 22px;
    border-bottom: 1px #2B3033 solid;

    & > button{
        padding-left: 0;
        padding-right: 0;
    }

    & > button > span > span:nth-child(1){
        margin-right: 6px;
        padding: 0;
    }
`;

export { GroupsContent, GroupsNames, GroupsNamesHeader, SingleGroup, GroupDevices, Pagination };
