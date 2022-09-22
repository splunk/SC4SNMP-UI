import React from 'react';

const validateInventory = (address, port, version, community, secret,
    securityEngine, walkInterval, profiles, initProfiles) => {

    let errors = {
        address: [],
        port: [],
        community: [],
        secret: [],
        securityEngine: [],
        walkInterval: [],
        profiles: []
    };
    let isValid = true;

    // Validate address
    if (address.length === 0){
        errors.address.push("Address or Group is required");
        isValid = false;
    }else if (Number.isInteger(Number(address.charAt(0)))){
        let doesMatch = address.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);
        let octetsValid = true;
        if (doesMatch){
            let octets = address.split(".");
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
    } else{
        if (!address.match(/^[a-zA-Z0-9_-]+$/)){
            isValid = false;
            errors.address.push("Group name can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces are allowed.");
        }
    }

    // Validate port
    if (!(Number.isInteger(port) && port > 0 && port < 65535)){
        isValid = false;
        errors.port.push("Port number must be an integer in range 1-65535");
    }

    // Validate community
    if (community.length > 0 && !community.match(/^[.a-zA-Z0-9_-]+$/)){
        isValid = false;
        errors.community.push("Community can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
    }

    // Validate secret
    if (version === "3" && secret.length === 0){
        isValid = false;
        errors.secret.push("When using SNMP version 3, secret must be specified");
    }
    if (secret.length > 0 && !secret.match(/^[.a-zA-Z0-9_-]+$/)){
        isValid = false;
        errors.secret.push("Secret can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
    }

    // Validate securityEngine
    if (securityEngine.length > 0 && !securityEngine.match(/^([A-F0-9]{10,64}|[a-f0-9]{10,64})$/)){
        isValid = false;
        errors.securityEngine.push("If provided, Security Engine can be consists only of 10-64 characters in " +
            "hexadecimal notation. All letter must be either upper or lowe case.");
    }

    // Validate Walk Interval
    if (!(Number.isInteger(walkInterval) && walkInterval >= 1800)){
        isValid = false;
        errors.walkInterval.push("Walk Interval number must be an integer greater than or equal 1800");
    }

    // Validate profiles
    for (const prof of profiles){
        if (!initProfiles.includes(prof)){
            isValid = false;
            errors.profiles.push(`${prof} is an invalid profile`);
        }
    }

    return [isValid, errors];
};

export default validateInventory;
