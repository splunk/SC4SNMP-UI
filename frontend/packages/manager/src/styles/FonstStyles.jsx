import { createGlobalStyle } from "styled-components";

const FontStyles = createGlobalStyle`
@font-face {
    font-family: 'Proxima Nova';
    src: url(./src/styles/fonts/ProximaNova/ProximaNova-Reg.otf ) format('opentype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Proxima Nova Bold';
    src: url(./src/styles/fonts/ProximaNova/ProximaNova-Bold.otf ) format('opentype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Proxima Nova Sbold';
    src: url(./src/styles/fonts/ProximaNova/ProximaNova-Sbold.otf ) format('opentype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Proxima Nova Xbold';
    src: url(./src/styles/fonts/ProximaNova/ProximaNova-Xbold.otf ) format('opentype');
    font-weight: normal;
    font-style: normal;
}

body {
    font-family: 'Proxima Nova';
}
`;

export  { FontStyles };
