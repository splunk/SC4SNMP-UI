import { createGlobalStyle } from "styled-components";
import Mathlete from "./fonts/Mathlete-BulkySlant-webfont.woff";

const FontStyles = createGlobalStyle`
@font-face {
    font-family: 'mathletebulky_slant';
    src: url(${Mathlete}) format('woff');
    font-weight: normal;
    font-style: normal;

}
`;

export  { FontStyles };
