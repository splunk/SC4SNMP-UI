import React, {useState} from "react";
import {jest} from "@jest/globals";
import ProfileContext from "../../store/profile-contxt";


const setStateMock = jest.fn()

export function MockProfileContextProvider(props) {
    // data for DeleteProfileModal
    const [profileId, setProfileId] = useState(null);

    // data for auto refreshing profiles panel
    const [profilesChange, setProfilesChange] = useState(true);


    // data for editing in AddProfileModal
    const [profileName, setProfileName] = useState('');
    const [frequency, setFrequency] = useState(1);
    const [varBinds, setVarBinds] = useState([]);
    const [condition, setCondition] = useState(("profileType" in props["profileProps"] ? props["profileProps"]["profileType"] : "standard"));
    const [conditionField, setConditionField] = useState("");
    const [conditionPatterns, setConditionPatterns] = useState([]);
    const [conditional, setConditional] = useState([]);
    const [isEdit, setIsEdit] = useState(false);

    function profilesChangeHandler() {
        setProfilesChange(prev => {return !prev;});
    }

    const context = {
        profileId,
        setProfileId,
        deleteOpen: false,
        setDeleteOpen: setStateMock,
        deleteModalToggle: null,
        profilesChange,
        makeProfilesChange: profilesChangeHandler,
        addOpen: true,
        setAddOpen: setStateMock,
        addModalToggle: null,

        profileName,
        setProfileName,
        frequency,
        setFrequency,
        varBinds,
        setVarBinds,
        condition,
        setCondition,
        conditionField,
        setConditionField,
        conditionPatterns,
        setConditionPatterns,
        conditional,
        setConditional,
        isEdit,
        setIsEdit
    };

    return(
        <ProfileContext.Provider value={context}>
            {props.children}
        </ProfileContext.Provider>
    )
}
