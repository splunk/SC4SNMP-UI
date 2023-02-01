import React from 'react';

const validateProfiles = (validationObj) => {
    /*
     'errors' is an object storing error messages for each field. Example data structure for 'errors':
     profileName: ["message1", "message2"] -> list of messages for profile name
     frequency: ["message1", "message2"] -> list of messages for frequency
     conditionField: ["message1", "message2"] -> list of messages for 'field' input
     conditionPatterns: {2: ["message1", "message2"], 5: ["message3"]} -> key indicates index of a pattern. Each pattern has its own list of errors
     varBinds: {0: ["message1", "message2"], 3: ["message3"]} -> key indicates index of a varBind. Each varBind has its own list of errors
     */

    let errors = {
        profileName: [],
        frequency: [],
        conditionField: [],
        conditionPatterns: {},
        varBinds: {}
    };
    let isValid = true;

    // Validate Profile Name
    if (validationObj.hasOwnProperty("profileName")){
        if (validationObj.profileName.length === 0){
            errors.profileName.push("Profile Name is required");
            isValid = false;
        }else if (!validationObj.profileName.match(/^[a-zA-Z0-9_-]+$/)){
            errors.profileName.push("Profile Name can consist only of upper and lower english letters, " +
                "numbers and two special characters: '-' and '_'. No spaces are allowed.");
            isValid = false;
        };
    };

    // Validate Frequency
    if (validationObj.hasOwnProperty("frequency")){
        if (!(Number.isInteger(validationObj.frequency) && validationObj.frequency > 0)){
            errors.frequency.push("Frequency must be a positive integer");
            isValid = false;
        };
    };

    let message;
    // Validate Condition
    if (validationObj.hasOwnProperty("conditions")){
        if (validationObj.conditions.condition === "field"){
            // Validate 'field' input
            if (validationObj.conditions.field.length === 0){
                errors.conditionField.push("Field is required");
                isValid = false;
            }else if (!validationObj.conditions.field.match(/^[.a-zA-Z0-9_-]+$/)){
                errors.conditionField.push("Field can consist only of upper and lower english letters, " +
                "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
                isValid = false;
            };
            // Validate each pattern
            for (let i = 0; i < validationObj.conditions.patterns.length; i++){
                if (validationObj.conditions.patterns[i].pattern.length === 0){
                    message = "Pattern is required";
                    if (i in errors.conditionPatterns){
                        errors.conditionPatterns[i].push(message);
                    }else{
                        errors.conditionPatterns[i] = [message];
                    }
                    isValid = false;
                }/* else if (!validationObj.conditions.patterns[i].pattern.match(/^\.\*[.\sa-zA-Z0-9_-]+\.\*$/)){
                    message = "Pattern must match this example .*MY-PATTERN.* . MY-PATTERN can consist only " +
                    "of upper and lower english letters, numbers and three special characters: '.' '-' and '_'"
                    if (i in errors.conditionPatterns){
                        errors.conditionPatterns[i].push(message);
                    }else{
                        errors.conditionPatterns[i] = [message];
                    }
                    isValid = false;
                }; */
            };
        };
    };

    // Validate VarBinds
    let varBindsCategoryValid;
    if (validationObj.hasOwnProperty("varBinds")){
        for (let i = 0; i < validationObj.varBinds.length; i++){
            if (validationObj.varBinds[i].family.length === 0){
                message = "MIB-Component is required";
                if (i in errors.varBinds){
                    errors.varBinds[i].push(message);
                }else{
                    errors.varBinds[i] = [message];
                };
                isValid = false;

            }else if (!validationObj.varBinds[i].family.match(/^[a-zA-Z0-9_-]+$/)){
                let message = "MIB-Component can consist only of upper and lower english letters, " +
                "numbers and two special characters: '-' and '_'. No spaces are allowed."
                if (i in errors.varBinds){
                    errors.varBinds[i].push(message);
                }else{
                    errors.varBinds[i] = [message];
                };
                isValid = false;
            };

            varBindsCategoryValid = true;
            if (validationObj.varBinds[i].category.length > 0){
                if (!validationObj.varBinds[i].category.match(/^[a-zA-Z0-9_-]+$/)){
                    message = "MIB object can consist only of upper and lower english letters, " +
                        "numbers and two special characters: '-' and '_'. No spaces are allowed.";
                    if (i in errors.varBinds){
                        errors.varBinds[i].push(message);
                    }else{
                        errors.varBinds[i] = [message];
                    };
                    isValid = false;
                    varBindsCategoryValid = false;
                };
            };

            if (validationObj.varBinds[i].index.length > 0){
                if (!(Number.isInteger(Number(validationObj.varBinds[i].index)) && Number(validationObj.varBinds[i].index) >= 0)){
                    message = "MIB index number must be a integer greater or equal 0";
                    if (i in errors.varBinds){
                        errors.varBinds[i].push(message);
                    }else{
                        errors.varBinds[i] = [message];
                    };
                    isValid = false;
                }else if (validationObj.varBinds[i].category.length == 0){
                    message = "MIB object is required when MIB index is specified";
                    if (i in errors.varBinds){
                        errors.varBinds[i].push(message);
                    }else{
                        errors.varBinds[i] = [message];
                    };
                    isValid = false;
                };
            };
        };
    };

    return [isValid, errors];
};

export default validateProfiles;
