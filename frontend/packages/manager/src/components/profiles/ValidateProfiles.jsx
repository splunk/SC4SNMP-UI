import React, {useState, createContext, useRef} from 'react';

const validateProfiles = (profileName, frequency, conditions, varBinds) => {
    let errors = {
        profileName: [],
        frequency: [],
        condition: [],
        field: [],
        patterns: [],
        varBinds: {}
    };
    let isValid = true;

    if (profileName.length === 0){
        errors.profileName.push("Profile Name is required");
        isValid = false;
    }else if (!profileName.match(/^[a-zA-Z0-9_-]+$/)){
        errors.profileName.push("Profile Name can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'. No spaces can be used in the name.");
        isValid = false;
    }

    if (!(Number.isInteger(frequency) && frequency > 0)){
        errors.frequency.push("Frequency must be a positive integer");
        isValid = false;
    }

    if (conditions.condition === "field"){
        if (conditions.field.length === 0){
            errors.condition.push("Field is required");
            isValid = false;
        }else if (!conditions.field.match(/^[.a-zA-Z0-9_-]+$/)){
            errors.condition.push("Field can consist only of upper and lower english letters, " +
            "numbers and three special characters: '.' '-' and '_'. No spaces can be used in the name.");
            isValid = false;
        }
        for (let i = 0; i < conditions.patterns.length; i++){
            if (conditions.patterns[i].pattern.length === 0){
                errors.condition.push(["Pattern is required", i]);
                isValid = false;
            }else if (!conditions.patterns[i].pattern.match(/^\.\*[.\sa-zA-Z0-9_-]+\.\*$/)){
                errors.condition.push(["Pattern must match this example .*MY-PATTERN.* . MY-PATTERN can consist only " +
                "of upper and lower english letters, numbers and three special characters: '.' '-' and '_'", i]);
                isValid = false;
            }
        }
    }

    let varBindsCategoryValid;
    for (let i = 0; i < varBinds.length; i++){
        if (varBinds[i].family.length === 0){

            if (i in errors.varBinds){
                errors.varBinds[i].push("MIB-Component is required");
            }else{
                errors.varBinds[i] = ["MIB-Component is required"];
            };
            isValid = false;

        }else if (!varBinds[i].family.match(/^[a-zA-Z0-9_-]+$/)){
            if (i in errors.varBinds){
                errors.varBinds[i].push("MIB-Component can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'");
            }else{
                errors.varBinds[i] = ["MIB-Component can consist only of upper and lower english letters, " +
            "numbers and two special characters: '-' and '_'"];
            };
            isValid = false;
        }

        varBindsCategoryValid = true;
        if (varBinds[i].category.length > 0){
            if (!varBinds[i].category.match(/^[a-zA-Z0-9_-]+$/)){
                if (i in errors.varBinds){
                    errors.varBinds[i].push("MIB object can consist only of upper and lower english letters, " +
                    "numbers and two special characters: '-' and '_'");
                }else{
                    errors.varBinds[i] = ["MIB object can consist only of upper and lower english letters, " +
                    "numbers and two special characters: '-' and '_'"];
                };
                isValid = false;
                varBindsCategoryValid = false;
            }
        }

        if (varBinds[i].index.length > 0){
            if (!(Number.isInteger(Number(varBinds[i].index)) && Number(varBinds[i].index) > 0)){
                if (i in errors.varBinds){
                    errors.varBinds[i].push("MIB index number must be a positive integer");
                }else{
                    errors.varBinds[i] = ["MIB index number must be a positive integer"];
                };
                isValid = false;
            }else if (varBinds[i].category.length == 0){
                if (i in errors.varBinds){
                    errors.varBinds[i].push("MIB object is required when MIB index is specified");
                }else{
                    errors.varBinds[i] = ["MIB object is required when MIB index is specified"];
                };
                isValid = false;
            }
        }
    }


    return [isValid, errors];
};

export default validateProfiles;
