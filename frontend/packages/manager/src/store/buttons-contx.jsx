import React, {useState, createContext} from 'react';

const ButtonsContext = createContext();

export function ButtonsContextProvider(props){
    const [buttonsOpen, setButtonsOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const context = {
        buttonsOpen: buttonsOpen,
        setButtonsOpen: setButtonsOpen,
        deleteOpen: deleteOpen,
        setDeleteOpen: setDeleteOpen
    };
    return (
        <ButtonsContext.Provider value={context}>
            {props.children}
        </ButtonsContext.Provider>
    )
};

export default ButtonsContext;
