import React from "react";
import PropTypes from 'prop-types';
import {validationGroup} from "../../styles/ValidationStyles";

function ValidationGroup(props){
    return(
        <div style={validationGroup}>
            {props.children}
        </div>
    )
}

ValidationGroup.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ValidationGroup;
