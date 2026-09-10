import styled from "styled-components";
import { variables } from "@splunk/themes";
import Table from "@splunk/react-ui/Table";

const RowActions = styled.div`
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
`;

// @splunk/react-ui's Table only draws a border between resizable columns (via each
// cell's resize handle) - it never frames the header row itself. The header's own
// top/bottom/left lines are added here explicitly rather than relying on that.
const StyledFramedTable = styled(Table)`
    thead[data-test="head"] {
        border-top: 1px solid ${variables.borderColor};
        border-bottom: 1px solid ${variables.borderColor};
    }

    thead[data-test="head"] th:first-child {
        border-left: 1px solid ${variables.borderColor};
    }
`;

export { RowActions, StyledFramedTable };
