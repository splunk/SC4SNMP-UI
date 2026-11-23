import styled from 'styled-components';
import { variables } from '@splunk/themes';

const DeviceRulesTable = styled.table`
    width: 100%;
    table-layout: auto;
    border-collapse: collapse;
    color: inherit;
    font: inherit;

    &, thead, tbody, tr, th, td {
        background: transparent;
        border: 0;
    }

    th, td {
        padding: ${variables.spacingXSmall} ${variables.spacingLarge};
        text-align: left;
        vertical-align: top;
        white-space: normal;
        overflow-wrap: anywhere;
    }
`;

export default DeviceRulesTable;
