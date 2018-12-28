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

const reduceRecursively = (array, ) => {

};

const forEachRecursively = (array, callback, childrenProperty, indexes = []) => {
    array.forEach((item, index) => {
        const curIndexes = [...indexes, index];
        if (Array.isArray(item)) {
            forEachRecursively(item, callback, childrenProperty, curIndexes);
            return;
        } else {
            callback(item, curIndexes);
            const children = childrenProperty && item[childrenProperty];
            if (children) forEachRecursively(children, callback, childrenProperty, curIndexes);
        }
    });
};

const compareRecursively = (array, initialValue, callback, childrenProperty) => {
    forEachRecursively(array, (iItem, iIndexes) => {
        forEachRecursively(array, (jItem, jIndexes) => {
            initialValue = callback(initialValue, iItem, jItem);
        }, childrenProperty);
    }, childrenProperty);
};

export const validateArray = (reduce, validate, childrenProperty) => (value, fullPath) => {
    if (valueIsAbsent(value)) return;
    
    const result = reduceArrayRecursively(value, reduce, childrenProperty, initialValue);
    return validate(result);
};

export const unique = (comparator = (value, item) => value === item, message, childrenProperty) => {
    const reduce = (accumulator, iItem, jItem) => comparator(iItem, jItem) ? accumulator + 1 : accumulator;
    const validate = (item, occurrences) => occurrences > 1 ? (message || "Value is not unique") : undefined;
    return validateArray(reduce, validate, childrenProperty);
};

/*export const unique = (comparator = (value, item) => value === item, message) => (value, allValues, context) => {
    if (valueIsAbsent(value)) return;
    const { currentArray } = context;
    const occurrences = currentArray.reduce((prev, item) => {
        return comparator(value, item) ? prev + 1 : prev;
    }, 0);
    return occurrences > 1 ? (message || "Value is not unique") : undefined;
};*/

const validateValue = (value, validators, fullPath, context) => {
    if (!Array.isArray(validators)) validators = [validators];
    // Returning only first error
    let error;
    for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        error = validator(value, fullPath, context.object, context.index);
        if (error) break;
    }
    return error;
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

const validateObject = (object = { }, path, schema, context) => {
    
    const { _root, ...rest } = schema;
    const initialErrors = (_root && validateValue(object, _root, "", context)) || { };

    const errors = Object.keys(rest).reduce((prev, curProperty) => {
        const exec = (prev, curProperty) => {
            const fullPath = `${path ? path + "." : ""}${curProperty}`;
            const validators = schema[curProperty];
            const propertyValue = object[curProperty];
            return validateProperty(prev, propertyValue, fullPath, validators, context);
        };
        return prev instanceof Promise ? prev.then(prev => exec(prev, curProperty)) : exec(prev, curProperty);
    }, initialErrors);

    const transform = errors => Object.keys(errors).length > 0 ? errors : undefined;
    return errors instanceof Promise ?
        errors.then(errors => transform(errors)) :
        transform(errors);

};

export const validate = (object, schema) => {
    return validateObject(object, "", schema, { object });
};