import React, {useState, createContext, useContext} from 'react';

const ButtonsContext = createContext();

export function ButtonsContextProvider(props){
    const [deleteOpen, setDeleteOpen] = useState(false);

    const context = {
        deleteOpen,
        setDeleteOpen
    };
    return (
        <ButtonsContext.Provider value={context}>
            {props.children}
        </ButtonsContext.Provider>
    )
};

export const useButtonsContext = () => useContext(ButtonsContext);
export default ButtonsContext;
