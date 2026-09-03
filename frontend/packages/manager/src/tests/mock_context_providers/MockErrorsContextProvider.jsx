import React, {useState} from "react";
import PropTypes from 'prop-types';
import ErrorsModalContext from "../../store/errors-modal-contxt";

export function MockErrorsContextProvider(props){
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [errorType, setErrorType] = useState("info");

    const context = {
        open,
        setOpen,
        message,
        setMessage,
        errorType,
        setErrorType
    };
    return (
        <ErrorsModalContext.Provider value={context}>
            {props.children}
        </ErrorsModalContext.Provider>
    )
};

MockErrorsContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
