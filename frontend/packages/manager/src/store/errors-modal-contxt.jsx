import React, {useState, createContext} from 'react';

const ErrorsModalContext = createContext();

export function ErrorsModalContextProvider(props){
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");

    const context = {
        open: open,
        setOpen: setOpen,
        message: message,
        setMessage: setMessage
    };
    return (
        <ErrorsModalContext.Provider value={context}>
            {props.children}
        </ErrorsModalContext.Provider>
    )
};

export default ErrorsModalContext;
