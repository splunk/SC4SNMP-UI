import React, {useState, createContext, useContext} from 'react';
import PropTypes from 'prop-types';

const MenuHeaderContxt = createContext();

export function MenuHeaderContxtProvider(props){
    const [activeTabId, setActiveTabId] = useState('Profiles');

    const context = {
        activeTabId,
        setActiveTabId
    };

    return(
        <MenuHeaderContxt.Provider value={context}>
            {props.children}
        </MenuHeaderContxt.Provider>
    )
};

MenuHeaderContxtProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useMenuHeaderContxt = () => useContext(MenuHeaderContxt);
export default MenuHeaderContxt;
