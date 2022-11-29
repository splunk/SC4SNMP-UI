import styled from "styled-components";
import TabBar from '@splunk/react-ui/TabBar';

const StyledTab = styled(TabBar)`
      border: 0;
      background-color: #3C444D;
      height: 44px;
      border-bottom: 0;
      margin: 0;

      &::before{
        border: 0;
      }

      & > button{
        margin: 0;
        padding: 0;
      }
      & > button:focus {
         outline: none;
         box-shadow: none;
      }

      & > button:nth-child(1){
        margin-left: 20px;
      }
      & > button:nth-child(1) > div[class*='TabStyles__StyledLabel']{
        width: 51px;
      }

      & > button:nth-child(2){
        margin-left: 27px;
      }
      & > button:nth-child(2) > div[class*='TabStyles__StyledLabel']{
        width: 49px;
      }

      & > button:nth-child(3){
        margin-left: 27px;
      }
      & > button:nth-child(3) > div[class*='TabStyles__StyledLabel']{
        width: 63px;
      }

      & > button > div[class*='TabStyles__StyledLabel']{
        font-size: 14px;
        font-weight: 400;
        line-height: 39px;
        color: #E1E6EB;
        border: 0;
        margin: 0;
        padding: 0;
      }

      & > button > div[class*='TabStyles__StyledUnderline']{
        bottom: 0;
        width: 100%;
      }
      [aria-selected='true'] > div[class*='TabStyles__StyledUnderline']{
        background-color: #5CC05C;
      }
      [aria-selected='true'] > div[class*='TabStyles__StyledLabel']{
        color: #FFFFFF;
        font-weight: 600;
      }
    `;

const StyledMenuBar = styled.div`
    width: 100%;
    height: 44px;
    display: flex;
    background-color: #3C444D;
`;

const StyledMenuBarLeft = styled.div`
    width: 50%;
    height: 44px;
`;

const StyledMenuBarRight = styled.div`
    width: 50%;
    height: 44px;
    display: flex;
    justify-content: flex-end;


    & > div {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 166px;
        margin-right: 20px;
    }

    & > div > P{
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        color: #FFFFFF;
        margin-bottom: 4px;
    }
`;

export { StyledTab, StyledMenuBar, StyledMenuBarLeft, StyledMenuBarRight };
