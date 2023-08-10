import React from 'react';

const sameConditions = (configuredConditions, fieldName, newConditionKeys) => {
    /*
        configuredConditions: {"fieldName1": [["fieldName1", "value1"], ["fieldName1", "value2", "value3"]]}
        fieldName: "fieldName1"
        newConditionKeys: ["fieldName1", "value5"]
    */
    if (fieldName in configuredConditions && fieldName.length > 0){
        for (const keys of configuredConditions[fieldName]){
            if (keys.length === newConditionKeys.length){
                return keys.every(element => {
                    return !!newConditionKeys.includes(element);
                });
            }
            return false
        }
    } else{
        console.log("fieldName not in configuredConditions")
        return false
    }
}

const validateProfiles = (validationObj) => {
    /*
     'errors' is an object storing error messages for each field. Example data structure for 'errors':

     profileName: ["message1", "message2"] -> list of messages for profile name

     frequency: ["message1", "message2"] -> list of messages for frequency

     conditionField: ["message1", "message2"] -> list of messages for 'field' input

     conditionPatterns: {2: ["message1", "message2"], 5: ["message3"]} -> key indicates index of a pattern. Each pattern has its own list of errors

     conditionalField: {2: ["message1", "message2"], 5: ["message3"]} -> key indicates index of a conditional key. Each pattern has its own list of errors

     conditionalValues: {2:{1:["message1", "message2"], 3:["message1"]}, 6:{0:["message1"]}} -> key indicates index of a condition. Each condition
     is represented by an object where keys correspond to indices of values of this condition. Each value has its own list of errors.

     varBinds: {0: ["message1", "message2"], 3: ["message3"]} -> key indicates index of a varBind. Each varBind has its own list of errors
     */

    const errors = {
        profileName: [],
        frequency: [],
        conditionField: [],
        conditionPatterns: {},
        patternsExist: "",
        conditionalField: {},
        conditionalValues: {},
        conditionalValuesExist: {},
        conditionalExist: "",
        varBinds: {},
        varBindsExist: ""
    };
    let isValid = true;

    // Validate Profile Name
    if ("profileName" in validationObj){
        if (validationObj.profileName.length === 0){
            errors.profileName.push("Profile Name is required");
            isValid = false;
        }else if (!validationObj.profileName.match(/^[a-zA-Z0-9_-]+$/)){
            errors.profileName.push("Profile Name can consist only of upper and lower english letters, " +
                "numbers and two special characters: '-' and '_'. No spaces are allowed.");
            isValid = false;
        }
    }

    // Validate Frequency
    if ("frequency" in validationObj){
        if (!(Number.isInteger(validationObj.frequency) && validationObj.frequency > 0)){
            errors.frequency.push("Frequency must be a positive integer");
            isValid = false;
        }
    }

    let message;
    // Validate Condition
    if ("conditions" in validationObj){
        if (validationObj.conditions.condition === "smart"){
            // Validate 'field' input
            if (validationObj.conditions.field.length === 0){
                errors.conditionField.push("Field is required");
                isValid = false;
            }else if (!validationObj.conditions.field.match(/^[.a-zA-Z0-9_-]+$/)){
                errors.conditionField.push("Field can consist only of upper and lower english letters, " +
                "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
                isValid = false;
            }
            // Check if patterns exist
            if ( validationObj.conditions.patterns.length === 0){
                errors.patternsExist = "At least one pattern must be specified.";
                isValid = false;
            }
            // Validate each pattern
            const configuredPatterns = {};
            let patternKey;
            for (let i = 0; i < validationObj.conditions.patterns.length; i++){
                patternKey = validationObj.conditions.patterns[i].pattern;
                if (patternKey in configuredPatterns && patternKey.length > 0){
                    message = "The same pattern has been already configured for this profile"
                    if (i in errors.varBinds){
                        errors.conditionPatterns[i].push(message);
                    }else{
                        errors.conditionPatterns[i] = [message];
                    }
                    isValid = false;
                }else{
                    configuredPatterns[patternKey] = true
                }
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
            }
        }else if (validationObj.conditions.condition === "conditional"){
            let values;
            if (validationObj.conditions.conditions.length === 0){
                errors.conditionalExist = "At least one condition must be specified.";
                isValid = false;
            }
            let field
            const configuredConditions = {};
            let fieldKey;
            let conditionKeys = [];
             for (let i = 0; i < validationObj.conditions.conditions.length; i++){
                field = validationObj.conditions.conditions[i].field;
                values = validationObj.conditions.conditions[i].value;
                fieldKey = `${field}`;
                conditionKeys = [fieldKey];
                values.forEach(v => {conditionKeys.push(`${v}`)});
                conditionKeys.push(validationObj.conditions.conditions[i].operation)
                if (sameConditions(configuredConditions, fieldKey, conditionKeys)){
                    message = "The same condition has been already configured for this profile"
                    if (i in errors.varBinds){
                        errors.conditionalField[i].push(message);
                    }else{
                        errors.conditionalField[i] = [message];
                    }
                    isValid = false;
                }else if (fieldKey in configuredConditions){
                    configuredConditions[fieldKey].push(conditionKeys)
                }else{
                    configuredConditions[fieldKey] = [conditionKeys]
                }

                if (field.length === 0){
                    if (i in errors.conditionalField){
                        errors.conditionalField[i].push("Field is required");
                    }else{
                        errors.conditionalField[i] = ["Field is required"];
                    }
                    isValid = false;
                }else if (!field.match(/^[.a-zA-Z0-9_-]+$/)){
                    if (i in errors.conditionalField){
                        errors.conditionalField[i].push("Field can consist only of upper and lower english letters, " +
                    "numbers and three special characters: '.' '-' and '_'. No spaces are allowed.");
                    }else{
                        errors.conditionalField[i] = ["Field can consist only of upper and lower english letters, " +
                    "numbers and three special characters: '.' '-' and '_'. No spaces are allowed."];
                    }
                    isValid = false;
                }

                if (values.length === 0){
                    errors.conditionalValuesExist[i] = "At least one value must be specified.";
                    isValid = false;
                }
                let conditionsErrors = {}
                const configuredConditionalValues = {};
                for (let j = 0; j < values.length; j++){
                    message = ""
                    if (values[j].length === 0){
                        message = "Value is required"
                        isValid = false;
                    }else if(values[j] in configuredConditionalValues) {
                        message = "The same value has been already configured for this condition"
                        isValid = false;
                    }
                    if (!(values[j] in configuredConditionalValues)){
                        configuredConditionalValues[values[j]] = true;
                    }
                    if (message.length > 0){
                        if (i in errors.conditionalValues && j in errors.conditionalValues[i]){
                            errors.conditionalValues[i][j].push(message);
                        }else if (i in errors.conditionalValues){
                            errors.conditionalValues[i][j] = [message];
                        }
                        else{
                            conditionsErrors = {}
                            conditionsErrors[j] = [message]
                            errors.conditionalValues[i] = conditionsErrors;
                        }
                    }
                }
             }
        }
    }

    // Validate VarBinds
    if ("varBinds" in validationObj){
        if (validationObj.varBinds.length === 0){
            errors.varBindsExist = "At least one varBind must be specified.";
            isValid = false;
        }
        const configuredVarBinds = {};
        let varBindKey;
        for (let i = 0; i < validationObj.varBinds.length; i++){
            varBindKey = `${validationObj.varBinds[i].component}${validationObj.varBinds[i].object}${validationObj.varBinds[i].index}`
            if (varBindKey in configuredVarBinds && varBindKey.length > 0){
                message = "The same varBind has been already configured for this profile"
                if (i in errors.varBinds){
                    errors.varBinds[i].push(message);
                }else{
                    errors.varBinds[i] = [message];
                }
                isValid = false;
            }else{
                configuredVarBinds[varBindKey] = true
            }
            if (validationObj.varBinds[i].component.length === 0){
                message = "MIB-Component is required";
                if (i in errors.varBinds){
                    errors.varBinds[i].push(message);
                }else{
                    errors.varBinds[i] = [message];
                }
                isValid = false;

            }else if (!validationObj.varBinds[i].component.match(/^[a-zA-Z0-9._-]+$/) || !isNaN(validationObj.varBinds[i].component)){
                message = "MIB component can consist only of upper and lower english letters, " +
                "numbers and three special characters: '.', '-' and '_'. No spaces are allowed. MIB component can't be a number."
                if (i in errors.varBinds){
                    errors.varBinds[i].push(message);
                }else{
                    errors.varBinds[i] = [message];
                }
                isValid = false;
            }

            if (validationObj.varBinds[i].object.length > 0){
                if (!validationObj.varBinds[i].object.match(/^[a-zA-Z0-9._-]+$/) || !isNaN(validationObj.varBinds[i].object)){
                    message = "MIB object can consist only of upper and lower english letters, " +
                        "numbers and three special characters: '.', '-' and '_'. No spaces are allowed. MIB object can't be a number.";
                    if (i in errors.varBinds){
                        errors.varBinds[i].push(message);
                    }else{
                        errors.varBinds[i] = [message];
                    }
                    isValid = false;
                }
            }

            if (validationObj.varBinds[i].index.length > 0){
                if (validationObj.varBinds[i].object.length === 0){
                    message = "MIB object is required when MIB index is specified";
                    if (i in errors.varBinds){
                        errors.varBinds[i].push(message);
                    }else{
                        errors.varBinds[i] = [message];
                    }
                    isValid = false;
                }
                if (!validationObj.varBinds[i].index.match(/^[^\s]+$/)){
                    message = "Index can't include white spaces";
                    if (i in errors.varBinds){
                        errors.varBinds[i].push(message);
                    }else{
                        errors.varBinds[i] = [message];
                    }
                    isValid = false;
                }
            }
        }
    }

    return [isValid, errors];
};

export default validateProfiles;
