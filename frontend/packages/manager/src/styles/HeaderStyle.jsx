import styled from "styled-components";

const StyledHeader = styled.div`
    height: 188px;
    width: 100%;
    display: flex;
`;


const StyledHeaderLeft = styled.div`
    height: 188px;
    width: 50%;
    display: flex;
    justify-content: flex-start;
    align-items: center;

    & > div{
        margin-left: 20px;
        width: 600px;
        display: flex;
        justify-content: flex-start;
        align-items: left;
        flex-direction: column;
    }

    & > div > #project-title > P{
        font-style: normal;
        font-weight: 700;
        font-size: 24px;
        line-height: 24px;
    }

    & > div > #project-description > P{
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 16px;
    }
`;

const StyledHeaderRight = styled.div`
    height: 188px;
    width: 50%;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    & > div {
        display: flex;
        margin-right: 20px;
    }
`;

export { StyledHeader, StyledHeaderLeft, StyledHeaderRight }
