import { createGlobalStyle } from "styled-components";
import ProximaNova from "./fonts/ProximaNova/ProximaNova-Reg.woff2";
import ProximaNovaBold from "./fonts/ProximaNova/ProximaNova-Bold.woff2";
import ProximaNovaSbold from "./fonts/ProximaNova/ProximaNova-Sbold.woff2";
import ProximaNovaXbold from "./fonts/ProximaNova/ProximaNova-Xbold.woff2";

const FontStyles = createGlobalStyle`
@font-face {
    font-family: 'Proxima Nova';
    src: url("${ProximaNova}") format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Proxima Nova Bold';
    src: url("${ProximaNovaBold}") format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Proxima Nova Sbold';
    src: url("${ProximaNovaSbold}") format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Proxima Nova Xbold';
    src: url("${ProximaNovaXbold}") format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

body {
    font-family: 'Proxima Nova';
}
`;

export  { FontStyles };
