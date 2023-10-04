import React, {useState, createContext, useContext} from 'react';

const MenuHeaderContxt = createContext();

export function MenuHeaderContxtProvider(props){
    const [activeTabId, setActiveTabId] = useState('Profiles');

    const context = {
        activeTabId: activeTabId,
        setActiveTabId: setActiveTabId
    };

    return(
        <MenuHeaderContxt.Provider value={context}>
            {props.children}
        </MenuHeaderContxt.Provider>
    )
};

export const useMenuHeaderContxt = () => useContext(MenuHeaderContxt);
export default MenuHeaderContxt;
