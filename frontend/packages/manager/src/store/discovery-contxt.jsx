import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export const emptyEntry = () => ({
    name: '', networkAddress: '', version: '2c', port: '161', community: '', secret: '',
    securityEngine: '', frequency: '86400', deleteAlreadyDiscovered: false, deviceRules: [],
});

const noop = () => {};

// Safe default so components (e.g. Header) work when rendered without the provider.
const defaultContext = {
    change: false, makeChange: noop, entry: emptyEntry(), setEntry: noop,
    entryId: null, setEntryId: noop, isEdit: false, setIsEdit: noop,
    addOpen: false, setAddOpen: noop, addModalToggle: { current: null }, resetForm: noop,
};

const DiscoveryContext = createContext(defaultContext);

export function DiscoveryContextProvider({ children }) {
    const [change, setChange] = useState(false);
    const [entry, setEntry] = useState(emptyEntry());
    const [entryId, setEntryId] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const addModalToggle = useRef(null);
    const context = useMemo(() => ({
        change, makeChange: () => setChange((value) => !value), entry, setEntry,
        entryId, setEntryId, isEdit, setIsEdit, addOpen, setAddOpen,
        addModalToggle,
        resetForm: () => { setEntry(emptyEntry()); setEntryId(null); },
    }), [change, entry, entryId, isEdit, addOpen]);
    return <DiscoveryContext.Provider value={context}>{children}</DiscoveryContext.Provider>;
}

DiscoveryContextProvider.propTypes = { children: PropTypes.node.isRequired };
export const useDiscoveryContext = () => useContext(DiscoveryContext);
export default DiscoveryContext;
