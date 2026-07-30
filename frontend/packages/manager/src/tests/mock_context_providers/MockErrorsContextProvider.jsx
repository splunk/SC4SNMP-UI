import React, {useState} from "react";
import ErrorsModalContext from "../../store/errors-modal-contxt";

export function MockErrorsContextProvider(props){
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [errorType, setErrorType] = useState("info");

    const context = {
        open: open,
        setOpen: setOpen,
        message: message,
        setMessage: setMessage,
        errorType: errorType,
        setErrorType: setErrorType
    };
    return (
        <ErrorsModalContext.Provider value={context}>
            {props.children}
        </ErrorsModalContext.Provider>
    )
};
