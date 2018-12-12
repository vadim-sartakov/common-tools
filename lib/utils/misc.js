"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var shouldRestoreValue = function shouldRestoreValue(fullProperty, _ref) {
    var exclusive = _ref.exclusive,
        fields = _ref.fields;

    return exclusive && fields[fullProperty] === 0 || !exclusive && fields[fullProperty] === undefined && !Object.keys(fields).some(function (field) {
        return field.startsWith(fullProperty);
    });
};

var shouldProcessObjectRecursively = function shouldProcessObjectRecursively(value, fields, fullProperty) {
    return (typeof value === "undefined" ? "undefined" : _typeof(value)) === "object" && Object.keys(fields).some(function (field) {
        return field.startsWith(fullProperty + ".");
    });
};

var filterObjectRecursively = function filterObjectRecursively(payload) {
    var initialObject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var rootProperty = arguments[2];
    var _ref2 = arguments[3];
    var fields = _ref2.fields,
        exclusive = _ref2.exclusive;

    return Object.keys(payload).reduce(function (prev, payloadProperty) {
        var payloadValue = payload[payloadProperty];
        var mergeValue = initialObject[payloadProperty];
        var fullProperty = "" + (rootProperty ? rootProperty + "." : "") + payloadProperty;
        var result = void 0;
        if (shouldRestoreValue(fullProperty, { fields: fields, exclusive: exclusive })) {
            result = mergeValue;
        } else if (Array.isArray(payloadValue)) {
            result = payloadValue.map(function (payloadItem, index) {
                if (!shouldProcessObjectRecursively(payloadValue, fields, fullProperty)) return payloadItem;
                // Looking row with same id in `initialObject`
                var initialRowObject = mergeValue && mergeValue.find(function (mergeItem) {
                    return mergeItem.id === payloadItem.id;
                });
                return filterObjectRecursively(payloadValue[index], initialRowObject, fullProperty, { fields: fields, exclusive: exclusive });
            });
        } else if (shouldProcessObjectRecursively(payloadValue, fields, fullProperty)) {
            result = filterObjectRecursively(payloadValue, mergeValue, fullProperty, { fields: fields, exclusive: exclusive });
        } else {
            result = payloadValue;
        }
        return result !== undefined && _extends({}, prev, _defineProperty({}, payloadProperty, result)) || prev;
    }, {});
};

var isExclusiveProjection = function isExclusiveProjection(fields) {
    return fields[Object.keys(fields)[0]] === 0;
};

var filterObject = exports.filterObject = function filterObject(object, fields, initialObject) {
    var exclusive = isExclusiveProjection(fields);
    return filterObjectRecursively(object, initialObject, "", { fields: fields, exclusive: exclusive });
};
//# sourceMappingURL=misc.js.map