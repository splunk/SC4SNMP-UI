import styled from "styled-components";
import ControlGroup from '@splunk/react-ui/ControlGroup';

const Pagination = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    & > button{
        padding-left: 0;
        padding-right: 0;
    }

    & > button > span > span:nth-child(1){
        margin-right: 6px;
        padding: 0;
    }
`;

const ModalControlGroup = styled(ControlGroup)`
    height: 32px;
    margin-bottom: 12px;
    margin-left: 0;
    margin-rifht: 0;
    width: 100%;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;

    & >  div:nth-child(2){
        margin-left: 0;
        margin-right: 1px;
    }
`;

export { Pagination, ModalControlGroup };
