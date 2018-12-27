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

export const uniqueArray = (comparator = (x, y) => x === y, message) => (value, path, allValues) => {
    if (valueIsAbsent(value)) return;
    // Removing index from path
    const arrayPath = path.replace(/\[\d+\]$/, "");
    const items = _.get(allValues, arrayPath);
    const occurrences = items.reduce((prev, cur) => {
        return comparator(cur, value) ? prev + 1 : prev;
    }, 0);
    return occurrences > 1 ? (message || "Value is not unique") : undefined;
};

const validateValue = (value, validators, fullPath, rootObject) => {
    if (!Array.isArray(validators)) validators = [validators];
    // Returning only first error
    let error;
    for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        error = validator(value, fullPath, rootObject);
        if (error) break;
    }
    return error;
};

const validateProperty = (prev, propertyValue, fullPath, validators, rootObject, rootSchema) => {

    let validationResult;
    if (Array.isArray(propertyValue)) {
        validationResult = propertyValue.reduce((prev, item, index) => {
            const arrayPath = `${fullPath}[${index}]`;
            return validateProperty(prev, item, arrayPath, validators, rootObject, rootSchema);
        }, { });
    } else if (typeof(validators) === "object") {
        validationResult = validateObject(propertyValue, fullPath, validators, rootObject, rootSchema);
    } else {
        validationResult = validateValue(propertyValue, validators, fullPath, rootObject);
    }

    const transformResult = validationResult => {
        if (typeof(validationResult) === "object") {
            return { ...prev, ...validationResult };
        } else {
            return validationResult ? { ...prev, [fullPath]: validationResult } : prev;
        }
    };

    return validationResult instanceof Promise ?
        validationResult.then(validationResult => transformResult(validationResult)) :
        transformResult(validationResult);

};

const validateObject = (object = { }, path, schema, rootObject, rootSchema) => {
    
    const { _root, ...rest } = schema;
    const initialErrors = (_root && validateValue(object, _root)) || { };

    const errors = Object.keys(rest).reduce((prev, curProperty) => {
        const exec = (prev, curProperty) => {
            const fullPath = `${path ? path + "." : ""}${curProperty}`;
            const validators = schema[curProperty];
            const propertyValue = object[curProperty];
            return validateProperty(prev, propertyValue, fullPath, validators, rootObject, rootSchema);
        };
        return prev instanceof Promise ? prev.then(prev => exec(prev, curProperty)) : exec(prev, curProperty);
    }, initialErrors);

    const transform = errors => Object.keys(errors).length > 0 ? errors : undefined;
    return errors instanceof Promise ?
        errors.then(errors => transform(errors)) :
        transform(errors);

};

export const validate = (object, schema) => {
    return validateObject(object, "", schema, object, schema);
};