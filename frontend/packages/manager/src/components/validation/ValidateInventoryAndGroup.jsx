import React from 'react';

const validateInventoryAndGroup = (validationObj) => {

    /*
     'errors' is an object storing error messages for each field.
     Each property is a list of errors for the respective field.
     */

    const errors = {
        groupName: [],
        address: [],
        port: [],
        community: [],
        secret: [],
        securityEngine: [],
        walkInterval: [],
        profiles: []
    };
    let isValid = true;

    // Validate group name
    if ("groupName" in validationObj){
        if (validationObj.groupName.length === 0){
            errors.groupName.push("Group name is required");
            isValid = false;
        }else if (!validationObj.groupName.match(/^[a-zA-Z0-9_-]+$/)){
            isValid = false;
            errors.groupName.push("Group name can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.");
        }
    }

    // Validate address
    if ("address" in validationObj){
        if (validationObj.address.length === 0){
            const err = (("inGroupConfig" in validationObj || ("inventoryType" in validationObj &&
                validationObj.inventoryType === "Host")) ? "Address or host name is required" : "Group is required")
            errors.address.push(err);
            isValid = false;
        }else if (!validationObj.address.match(/^[.a-zA-Z0-9_\-]+$/)){
            isValid = false;
            errors.address.push(`${("inGroupConfig" in validationObj || ("inventoryType" in validationObj &&
                validationObj.inventoryType === "Host")) ? "Address or host name" : "Group"} can consist only of upper and lower english letters, " +
            "numbers and three special characters: '-', '.' and '_'. No spaces are allowed.`);
        }
    }

    // Validate port
    if ("port" in validationObj){
        if (!("inGroupConfig" in validationObj) && validationObj.port.length === 0){
            isValid = false;
            errors.port.push("Port number must be specified");
        }else if (validationObj.port.length > 0){
            if (!(Number.isInteger(Number(validationObj.port)) && Number(validationObj.port) > 0 && Number(validationObj.port) < 65535)){
                isValid = false;
                errors.port.push("Port number must be an integer in range 1-65535");
            }
        }
    }

    // Validate community
    if ("community" in validationObj){
        if ((validationObj.version === "1" || validationObj.version === "2c") && validationObj.community.length === 0){
            isValid = false;
            errors.community.push("When using SNMP version 1 or 2c, community string must be specified");
        }
        if (validationObj.community.length > 0 && !validationObj.community.match(/^[.a-zA-Z0-9_-]+$/)){
            isValid = false;
            errors.community.push("Community can consist only of upper and lower english letters, " +
                "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
        }
    }

    // Validate secret
    if ("version" in validationObj && "secret" in validationObj){
        if (validationObj.version === "3" && validationObj.secret.length === 0){
            isValid = false;
            errors.secret.push("When using SNMP version 3, secret must be specified");
        }
        if (validationObj.secret.length > 0 && !validationObj.secret.match(/^[.a-zA-Z0-9_-]+$/)){
            isValid = false;
            errors.secret.push("Secret can consist only of upper and lower english letters, " +
                "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
        }
    }

    // Validate securityEngine
    if ("securityEngine" in validationObj){
        if (validationObj.securityEngine.length > 0 && !validationObj.securityEngine.match(/^([A-F0-9]{10,64}|[a-f0-9]{10,64})$/)){
            isValid = false;
            errors.securityEngine.push("If provided, Security Engine can consists only of 10-64 characters in " +
                "hexadecimal notation. All letter must be either upper or lowe case.");
        }
    }

    // Validate Walk Interval
    if ("walkInterval" in validationObj){
        if (!(Number.isInteger(validationObj.walkInterval) && validationObj.walkInterval >= 1800)){
            isValid = false;
            errors.walkInterval.push("Walk Interval number must be an integer greater than or equal 1800");
        }
    }

    // Validate profiles
    if ("profiles" in validationObj && "initProfiles" in validationObj){
        for (const prof of validationObj.profiles){
            if (!validationObj.initProfiles.includes(prof)){
                isValid = false;
                errors.profiles.push(`${prof} is an invalid profile`);
            }
        }
    }

    return [isValid, errors];
};

export default validateInventoryAndGroup;
