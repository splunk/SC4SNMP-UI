import React, {useState} from "react";
import {jest} from "@jest/globals";
import PropTypes from 'prop-types';
import DiscoveryContext, {emptyEntry} from "../../store/discovery-contxt";

export const discoveryMocks = {
    makeChange: jest.fn(),
    setAddOpen: jest.fn(),
};

export function MockDiscoveryContextProvider({children, initialEntry = null, initialIsEdit = false, initialEntryId = null}){
    const [entry, setEntry] = useState(initialEntry || emptyEntry());
    const [entryId, setEntryId] = useState(initialEntryId);
    const [isEdit, setIsEdit] = useState(initialIsEdit);
    const [addOpen, setAddOpenState] = useState(true);
    const [change, setChange] = useState(false);

    const context = {
        change,
        makeChange: () => { discoveryMocks.makeChange(); setChange((prev) => !prev); },
        entry, setEntry,
        entryId, setEntryId,
        isEdit, setIsEdit,
        addOpen,
        setAddOpen: (value) => { discoveryMocks.setAddOpen(value); setAddOpenState(value); },
        addModalToggle: { current: null },
        resetForm: () => { setEntry(emptyEntry()); setEntryId(null); },
    };
    return (
        <DiscoveryContext.Provider value={context}>
            {children}
        </DiscoveryContext.Provider>
    );
}

MockDiscoveryContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
    initialEntry: PropTypes.object,
    initialIsEdit: PropTypes.bool,
    initialEntryId: PropTypes.string,
};
