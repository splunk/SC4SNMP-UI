import React from "react";
import {validationGroup} from "../../styles/ValidationStyles";

function ValidationGroup(props){
    return(
        <div style={validationGroup}>
            {props.children}
        </div>
    )
}

export default ValidationGroup;
