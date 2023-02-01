import React from 'react';

const validateInventoryAndGroup = (validationObj) => {

    /*
     'errors' is an object storing error messages for each field.
     Each property is a list of errors for the respective field.
     */

    let errors = {
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
    if (validationObj.hasOwnProperty("groupName")){
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
    if (validationObj.hasOwnProperty("address")){
        if (validationObj.address.length === 0){
            const err = ((validationObj.hasOwnProperty("inGroupConfig")) ? "Address is required" : "Address or Group is required")
            errors.address.push(err);
            isValid = false;
        }else if (Number.isInteger(Number(validationObj.address.charAt(0))) || validationObj.hasOwnProperty("inGroupConfig")){
            const doesMatch = validationObj.address.match(/^(([1-9]{1}[0-9]{0,2})|(0))\.(([1-9]{1}[0-9]{0,2})|(0))\.(([1-9]{1}[0-9]{0,2})|(0))\.(([1-9]{1}[0-9]{0,2})|(0))$/);
            let octetsValid = true;
            if (doesMatch){
                let octets = validationObj.address.split(".");
                for (const octet of octets){
                    if (Number(octet) < 0 || Number(octet) > 255) {
                        octetsValid = false;
                        break;
                    }
                }
            }
            if(!doesMatch || !octetsValid){
                isValid = false;
                errors.address.push("Provided address isn't a valid IPv4 address")
            }
        }else{
            if (!validationObj.address.match(/^[a-zA-Z0-9_-]+$/)){
                isValid = false;
                errors.address.push("Group name can consist only of upper and lower english letters, " +
                "numbers and two special characters: '-' and '_'. No spaces are allowed.");
            }
        }
    }

    // Validate port
    if (validationObj.hasOwnProperty("port")){
        if (!validationObj.hasOwnProperty("inGroupConfig") && validationObj.port.length === 0){
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
    if (validationObj.hasOwnProperty("community")){
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
    if (validationObj.hasOwnProperty("version") && validationObj.hasOwnProperty("secret")){
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
    if (validationObj.hasOwnProperty("securityEngine")){
        if (validationObj.securityEngine.length > 0 && !validationObj.securityEngine.match(/^([A-F0-9]{10,64}|[a-f0-9]{10,64})$/)){
            isValid = false;
            errors.securityEngine.push("If provided, Security Engine can consists only of 10-64 characters in " +
                "hexadecimal notation. All letter must be either upper or lowe case.");
        }
    }

    // Validate Walk Interval
    if (validationObj.hasOwnProperty("walkInterval")){
        if (!(Number.isInteger(validationObj.walkInterval) && validationObj.walkInterval >= 1800)){
            isValid = false;
            errors.walkInterval.push("Walk Interval number must be an integer greater than or equal 1800");
        }
    }

    // Validate profiles
    if (validationObj.hasOwnProperty("profiles") && validationObj.hasOwnProperty("initProfiles")){
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
