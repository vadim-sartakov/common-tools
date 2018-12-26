import { format } from "util";
import _ from "lodash";

const valueIsAbsent = value => 
    value === undefined ||
    value === null ||
    value.length === 0 ||
    (typeof(value) === "object" && Object.keys(value).length === 0);

export const required = message => value => {
    if (valueIsAbsent(value)) return (message || "Value is required");
    return undefined;
};

export const match = (pattern, message) => value => {
    if (valueIsAbsent(value)) return;
    return new RegExp(pattern).test(value) ? undefined : (message || "Value is not valid");
};

const getValueToCheckBound = value => ( ( typeof(value) === "string" || isNaN(value) ) && value.length ) || value;

export const min = (minValue, message) => value => {
    if (valueIsAbsent(value)) return;
    const valueToCheck = getValueToCheckBound(value);
    return valueToCheck < minValue ? (message || format("Should be at least %s", minValue)) : undefined;
};

export const max = (maxValue, message) => value => {
    if (valueIsAbsent(value)) return;
    const valueToCheck = getValueToCheckBound(value);
    return valueToCheck > maxValue ? (message || format("Should be not more than %s", maxValue)) : undefined;
};

export const uniqueArray = (message, comparator = (x, y) => x === y) => (value, path, allValues) => {
    if (valueIsAbsent(value)) return;
    // Removing index from path
    const arrayPath = path.replace(/\[\d+\]$/, "");
    const items = _.get(allValues, arrayPath);
    const occurrences = items.reduce((prev, cur) => {
        return comparator(cur, value) ? prev + 1 : prev;
    }, 0);
    return occurrences > 1 ? (message || "Value is not unique") : undefined;
};

export const uniqueObject = (message, comparator, ...paths) => {

};

const validateRecursively = (object, rootProperty, validationSchema, sourceObject) => {
    
    return Object.keys(object).reduce((prev, property) => {

        const fullProperty = `${rootProperty ? rootProperty + "." : ""}${property}`;
        const value = object[property];
        const validators = validationSchema[property];

        const validationResult = validators.reduce((prev, validator) => {
            const isValid = validator(value, fullProperty, sourceObject);
        }, {});

        /*if (Array.isArray(value)) {
            value.forEach(item => validateRecursively(object, ));
        } else if (typeof(value) === "object") {

        }*/

        return validateRecursively(object[property], validationSchema[property], validationSchema);

    }, {});

};

export const validate = (object, schema) => {
    return validateRecursively(object, "", schema, object);
};