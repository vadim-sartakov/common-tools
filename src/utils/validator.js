import { format } from "util";

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

export const unique = (comparator = (itemX, itemY) => itemX === itemY, message, childrenProperty) => (value, fullPath) => {
    if (valueIsAbsent(value)) return;
    const errors = value.reduce((errorAccumulator, outerItem, index) => {
        const occurrences = value.reduce((occurrencesAccumulator, innerItem) => {
            return comparator(outerItem, innerItem) ? occurrencesAccumulator + 1 : occurrencesAccumulator;
        }, 0);
        const error = occurrences > 1 ? (message || "Value is not unique") : undefined;
        return error ? { ...errorAccumulator, [`${fullPath}[${index}]`]: error } : errorAccumulator;
    }, { });
    return Object.keys(errors).length === 0 ? undefined : errors;
};

const validateValue = (value, fullPath, validators, context) => {
    if (!Array.isArray(validators)) validators = [validators];
    // Returning only first error
    let error;
    for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        error = validator(value, fullPath, context.object, context);
        if (error) break;
    }
    return error;
};

const chainIfPromise = (value, onResolve, ...args) => {
    return value instanceof Promise ? value.then(resolvedValue => onResolve(resolvedValue, ...args)) : onResolve(value, ...args);
};

const validateProperty = (prev, propertyValue, fullPath, validators, context) => {

    let validationResult;
    if (Array.isArray(propertyValue)) {
        validationResult = propertyValue.reduce((prev, item, index) => {
            const arrayPath = `${fullPath}[${index}]`;
            return validateProperty(prev, item, arrayPath, validators, { ...context, index });
        }, { });
    } else if (typeof(validators) === "object") {
        validationResult = validateObject(propertyValue, fullPath, validators, context);
    } else {
        validationResult = validateValue(propertyValue, fullPath, validators, context);
    }

    return chainIfPromise(validationResult, validationResult => {
        if (typeof(validationResult) === "object") {
            return { ...prev, ...validationResult };
        } else {
            return validationResult ? { ...prev, [fullPath]: validationResult } : prev;
        }
    });

};

const validateObject = (object = { }, path, schema, context) => {
    
    const { _root, ...rest } = schema;
    const initialErrors = (_root && validateValue(object, "", _root, context)) || { };

    const errors = Object.keys(rest).reduce((prev, curProperty) => {
        return chainIfPromise(prev, (prev, curProperty) => {
            const fullPath = `${path ? path + "." : ""}${curProperty}`;
            const validators = schema[curProperty];
            const propertyValue = object[curProperty];
            return validateProperty(prev, propertyValue, fullPath, validators, context);
        }, curProperty);
    }, initialErrors);

    return chainIfPromise(errors, errors => Object.keys(errors).length > 0 ? errors : undefined);

};

export const validate = (object, schema) => {
    return validateObject(object, "", schema, { object });
};