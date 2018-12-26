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
    const validationResult = validators.reduce((prev, validator) => {
        const error = validator(value, fullPath, rootObject);
        return error ? [...prev, error] : prev;
    }, []);
    return validationResult;
};

const validateProperty = () => {

};

const validateObjectRecursively = (object, path, schema, rootObject, rootSchema) => {
    
    const { _root, ...rest } = schema;
    const initialErrors = (_root && validateValue(object, _root)) || { };

    return Object.keys(rest).reduce((prev, curProperty) => {

        const fullPath = `${path ? path + "." : ""}${curProperty}`;
        const validators = schema[curProperty];
        const propertyValue = object[curProperty];

        let validationResult;
        if (Array.isArray(propertyValue)) {
            validationResult = propertyValue.reduce((prev, item, index) => {
                const arrayPath = `${fullPath}[${index}]`;
                let itemValidationResult;
                if (typeof(item) === "object") {
                    itemValidationResult = validateObjectRecursively(propertyValue, arrayPath, validators, rootObject, rootSchema);
                } else {
                    itemValidationResult = validateValue(propertyValue, validators, arrayPath, rootObject);
                }
                return { ...prev, [arrayPath]: itemValidationResult };
                //validateRecursively(object, );
            }, { });
        } else if (typeof(value) === "object") {
            validationResult = validateObjectRecursively(propertyValue, fullPath, validators, rootObject, rootSchema);
        } else {
            validationResult = validateValue(propertyValue, validators, fullPath, rootObject);
        }

        return { ...prev, [fullPath]: validationResult };

    }, initialErrors);

};

export const validate = (object, schema) => {
    return validateObjectRecursively(object, "", schema, object, schema);
};