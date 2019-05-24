import { format } from "util";

const valueIsAbsent = value =>
  value === undefined ||
      value === null ||
      value.length === 0 ||
      (typeof (value) === "object" && !(value instanceof Date) && Object.keys(value).length === 0);

const getMessage = (message, key, path, value, defaultMessage) => {
  return (typeof (message) === "function" && message(key, path, value)) || message || defaultMessage;
};

export const required = message => (value, path) => {
  if (valueIsAbsent(value)) return getMessage(message, "required", path, value, "Value is required");
  return undefined;
};

export const match = (pattern, message) => (value, path) => {
  if (valueIsAbsent(value)) return;
  return new RegExp(pattern).test(value) ? undefined : getMessage(message, "match", path, value, "Value is not valid");
};

const getValueToCompare = value =>
  ((typeof (value) === "string" || isNaN(value)) && value.length) ||
      ((value instanceof Date) && value.getTime()) ||
      value;

export const min = (minValue, message) => (value, path) => {
  if (valueIsAbsent(value)) return;
  const valueToCheck = getValueToCompare(value);
  return valueToCheck < minValue ? getMessage(message, "min", path, value, format("Should be at least %s", minValue)) : undefined;
};

export const max = (maxValue, message) => (value, path) => {
  if (valueIsAbsent(value)) return;
  const valueToCheck = getValueToCompare(value);
  return valueToCheck > maxValue ? getMessage(message, "max", path, value, format("Should be not more than %s", maxValue)) : undefined;
};

const reduceRecursively = (array, callback, initialValue, childrenProperty, initialIndexes = []) => {
  return array.reduce((accumulator, item, index) => {
    const indexes = [...initialIndexes, index];
    let result = callback(accumulator, item, indexes);
    if (item[childrenProperty]) {
      result = reduceRecursively(item[childrenProperty], callback, result, childrenProperty, indexes);
    }
    return result;
  }, initialValue);
};

const toTreePath = (rootPath, childrenProperty, indexes) => {
  const chain = indexes.join(`].${childrenProperty}[`);
  return `${rootPath}[${chain}]`;
};

const array = (reducer, reducerInitialValue, validator, childrenProperty) => (value, fullPath, allValues) => {

  if (valueIsAbsent(value)) return;

  const errors = reduceRecursively(value, (errorAccumulator, outerItem, indexes) => {

    const result = reduceRecursively(value, (resultAccumulator, innerItem) => {
      return reducer(resultAccumulator, outerItem, innerItem);
    }, reducerInitialValue, childrenProperty);

    const error = validator(result, fullPath, allValues);
    return error ? { ...errorAccumulator, [toTreePath(fullPath, childrenProperty, indexes)]: error } : errorAccumulator;

  }, {}, childrenProperty);

  return Object.keys(errors).length === 0 ? undefined : errors;

};

export const uniqueArrayItem = (comparator = (itemX, itemY) => itemX === itemY, message, childrenProperty) => {
  const reducer = (occurrencesAccumulator, outerItem, innerItem) => {
    return comparator(outerItem, innerItem) ? occurrencesAccumulator + 1 : occurrencesAccumulator;
  };
  const validator = (occurrences, path) => occurrences > 1 ? getMessage(message, "unique", path, occurrences, "Value is not unique") : undefined;
  return array(reducer, 0, validator, childrenProperty);
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

  const validatorsType = typeof (validators);
  const validatorsIsObject = !Array.isArray(validators) && validatorsType !== null && validatorsType === "object";

  let validationResult;
  if (Array.isArray(propertyValue) && validatorsIsObject) {
    validationResult = propertyValue.reduce((prev, item, index) => {
      const arrayPath = `${fullPath}[${index}]`;
      return validateProperty(prev, item, arrayPath, validators, { ...context, index });
    }, {});
  } else if (validatorsIsObject) {
    validationResult = validateObject(propertyValue, fullPath, validators, context);
  } else {
    validationResult = validateValue(propertyValue, fullPath, validators, context);
  }

  return chainIfPromise(validationResult, validationResult => {
    if (validationResult !== null && typeof (validationResult) === "object") {
      return { ...prev, ...validationResult };
    } else {
      return validationResult ? { ...prev, [fullPath]: validationResult } : prev;
    }
  });

};

const validateObject = (object = {}, path, schema, context) => {

  const { _root, ...rest } = schema;
  const initialErrors = (_root && validateValue(object, "", _root, context)) || {};

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