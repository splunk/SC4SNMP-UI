import React, {useState, createContext, useContext} from 'react';
import PropTypes from 'prop-types';

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

ButtonsContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useButtonsContext = () => useContext(ButtonsContext);
export default ButtonsContext;
