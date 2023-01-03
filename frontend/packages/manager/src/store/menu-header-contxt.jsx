import React, {useState, createContext, useRef, useContext} from 'react';

const MenuHeaderContxt = createContext();

export function MenuHeaderContxtProvider(props){
    const [activeTabId, setActiveTabId] = useState('Groups');

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

export default MenuHeaderContxt;
