import React, {useState, createContext, useContext} from 'react';
import PropTypes from 'prop-types';

const ErrorsModalContext = createContext();

export function ErrorsModalContextProvider(props){
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [errorType, setErrorType] = useState("info"); // possible states: info, warning, error

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

ErrorsModalContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useErrorsModalContext = () => useContext(ErrorsModalContext);
export default ErrorsModalContext;
