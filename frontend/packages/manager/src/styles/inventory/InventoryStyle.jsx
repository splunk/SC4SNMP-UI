import styled from "styled-components";
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';


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


const StyledModalBody = styled(Modal.Body)`
     padding-left: 24px;
     padding-right: 24px;

     & > div > div > div > p {
        margin: 0;
     }
`;

const StyledControlGroup = styled(ControlGroup)`
    min-height: 32px;
    margin-bottom: 12px;
    margin-left: 0;
    margin-rifht: 0;
    width: 100%;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
`;

export { Pagination, StyledControlGroup, StyledModalBody };
