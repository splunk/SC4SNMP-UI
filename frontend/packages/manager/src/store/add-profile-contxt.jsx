import React, {useState, createContext, useRef} from 'react';

const AddProfileContext = createContext({
    addOpen: false,
    addModalToggle: null,
    setAddOpen: () => {}
});

export function AddProfileContxtProvider(props) {
    const [addOpen, setAddOpen] = useState(false);
    const addModalToggle = useRef(null);

    const context = {
            addOpen: addOpen,
            addModalToggle: addModalToggle,
            setAddOpen: setAddOpen
    };

    return(
        <AddProfileContext.Provider value={context}>
            {props.children}
        </AddProfileContext.Provider>
    )
}

export default AddProfileContext;
