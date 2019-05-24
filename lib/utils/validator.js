"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = exports.unique = exports.max = exports.min = exports.match = exports.required = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _util = require("util");

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var valueIsAbsent = function valueIsAbsent(value) {
  return value === undefined || value === null || value.length === 0 || (typeof value === "undefined" ? "undefined" : _typeof(value)) === "object" && !(value instanceof Date) && Object.keys(value).length === 0;
};

var getMessage = function getMessage(message, key, path, value, defaultMessage) {
  return typeof message === "function" && message(key, path, value) || message || defaultMessage;
};

var required = exports.required = function required(message) {
  return function (value, path) {
    if (valueIsAbsent(value)) return getMessage(message, "required", path, value, "Value is required");
    return undefined;
  };
};

var match = exports.match = function match(pattern, message) {
  return function (value, path) {
    if (valueIsAbsent(value)) return;
    return new RegExp(pattern).test(value) ? undefined : getMessage(message, "match", path, value, "Value is not valid");
  };
};

var getValueToCompare = function getValueToCompare(value) {
  return (typeof value === "string" || isNaN(value)) && value.length || value instanceof Date && value.getTime() || value;
};

var min = exports.min = function min(minValue, message) {
  return function (value, path) {
    if (valueIsAbsent(value)) return;
    var valueToCheck = getValueToCompare(value);
    return valueToCheck < minValue ? getMessage(message, "min", path, value, (0, _util.format)("Should be at least %s", minValue)) : undefined;
  };
};

var max = exports.max = function max(maxValue, message) {
  return function (value, path) {
    if (valueIsAbsent(value)) return;
    var valueToCheck = getValueToCompare(value);
    return valueToCheck > maxValue ? getMessage(message, "max", path, value, (0, _util.format)("Should be not more than %s", maxValue)) : undefined;
  };
};

var reduceRecursively = function reduceRecursively(array, callback, initialValue, childrenProperty) {
  var initialIndexes = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

  return array.reduce(function (accumulator, item, index) {
    var indexes = [].concat(_toConsumableArray(initialIndexes), [index]);
    var result = callback(accumulator, item, indexes);
    if (item[childrenProperty]) {
      result = reduceRecursively(item[childrenProperty], callback, result, childrenProperty, indexes);
    }
    return result;
  }, initialValue);
};

var toTreePath = function toTreePath(rootPath, childrenProperty, indexes) {
  var chain = indexes.join("]." + childrenProperty + "[");
  return rootPath + "[" + chain + "]";
};

var array = function array(reducer, reducerInitialValue, validator, childrenProperty) {
  return function (value, fullPath, allValues) {

    if (valueIsAbsent(value)) return;

    var errors = reduceRecursively(value, function (errorAccumulator, outerItem, indexes) {

      var result = reduceRecursively(value, function (resultAccumulator, innerItem) {
        return reducer(resultAccumulator, outerItem, innerItem);
      }, reducerInitialValue, childrenProperty);

      var error = validator(result, fullPath, allValues);
      return error ? _extends({}, errorAccumulator, _defineProperty({}, toTreePath(fullPath, childrenProperty, indexes), error)) : errorAccumulator;
    }, {}, childrenProperty);

    return Object.keys(errors).length === 0 ? undefined : errors;
  };
};

var unique = exports.unique = function unique() {
  var comparator = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function (itemX, itemY) {
    return itemX === itemY;
  };
  var message = arguments[1];
  var childrenProperty = arguments[2];

  var reducer = function reducer(occurrencesAccumulator, outerItem, innerItem) {
    return comparator(outerItem, innerItem) ? occurrencesAccumulator + 1 : occurrencesAccumulator;
  };
  var validator = function validator(occurrences, path) {
    return occurrences > 1 ? getMessage(message, "unique", path, occurrences, "Value is not unique") : undefined;
  };
  return array(reducer, 0, validator, childrenProperty);
};

var validateValue = function validateValue(value, fullPath, validators, context) {
  if (!Array.isArray(validators)) validators = [validators];
  // Returning only first error
  var error = void 0;
  for (var i = 0; i < validators.length; i++) {
    var validator = validators[i];
    error = validator(value, fullPath, context.object, context);
    if (error) break;
  }
  return error;
};

var chainIfPromise = function chainIfPromise(value, onResolve) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return value instanceof Promise ? value.then(function (resolvedValue) {
    return onResolve.apply(undefined, [resolvedValue].concat(args));
  }) : onResolve.apply(undefined, [value].concat(args));
};

var validateProperty = function validateProperty(prev, propertyValue, fullPath, validators, context) {

  var validatorsType = typeof validators === "undefined" ? "undefined" : _typeof(validators);
  var validatorsIsObject = !Array.isArray(validators) && validatorsType !== null && validatorsType === "object";

  var validationResult = void 0;
  if (Array.isArray(propertyValue) && validatorsIsObject) {
    validationResult = propertyValue.reduce(function (prev, item, index) {
      var arrayPath = fullPath + "[" + index + "]";
      return validateProperty(prev, item, arrayPath, validators, _extends({}, context, { index: index }));
    }, {});
  } else if (validatorsIsObject) {
    validationResult = validateObject(propertyValue, fullPath, validators, context);
  } else {
    validationResult = validateValue(propertyValue, fullPath, validators, context);
  }

  return chainIfPromise(validationResult, function (validationResult) {
    if (validationResult !== null && (typeof validationResult === "undefined" ? "undefined" : _typeof(validationResult)) === "object") {
      return _extends({}, prev, validationResult);
    } else {
      return validationResult ? _extends({}, prev, _defineProperty({}, fullPath, validationResult)) : prev;
    }
  });
};

var validateObject = function validateObject() {
  var object = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var path = arguments[1];
  var schema = arguments[2];
  var context = arguments[3];

  var _root = schema._root,
      rest = _objectWithoutProperties(schema, ["_root"]);

  var initialErrors = _root && validateValue(object, "", _root, context) || {};

  var errors = Object.keys(rest).reduce(function (prev, curProperty) {
    return chainIfPromise(prev, function (prev, curProperty) {
      var fullPath = "" + (path ? path + "." : "") + curProperty;
      var validators = schema[curProperty];
      var propertyValue = object[curProperty];
      return validateProperty(prev, propertyValue, fullPath, validators, context);
    }, curProperty);
  }, initialErrors);

  return chainIfPromise(errors, function (errors) {
    return Object.keys(errors).length > 0 ? errors : undefined;
  });
};

var validate = exports.validate = function validate(object, schema) {
  return validateObject(object, "", schema, { object: object });
};
//# sourceMappingURL=validator.js.map