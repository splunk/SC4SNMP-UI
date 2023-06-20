import { createGlobalStyle } from "styled-components";
import ProximaNova from "./fonts/ProximaNova/ProximaNova-Reg.otf";
import ProximaNovaBold from "./fonts/ProximaNova/ProximaNova-Bold.otf";
import ProximaNovaSbold from "./fonts/ProximaNova/ProximaNova-Sbold.otf";
import ProximaNovaXbold from "./fonts/ProximaNova/ProximaNova-Xbold.otf";

const FontStyles = createGlobalStyle`
@font-face {
    font-family: 'Proxima Nova';
    src: url("${ProximaNova}") format('opentype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Proxima Nova Bold';
    src: url("${ProximaNovaBold}") format('opentype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Proxima Nova Sbold';
    src: url("${ProximaNovaSbold}") format('opentype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Proxima Nova Xbold';
    src: url("${ProximaNovaXbold}") format('opentype');
    font-weight: normal;
    font-style: normal;
}

body {
    font-family: 'Proxima Nova';
}
`;

export  { FontStyles };
