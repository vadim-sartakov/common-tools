"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var getPermissions = exports.getPermissions = function getPermissions(user, securitySchema) {
    for (var _len = arguments.length, accessModifiers = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        accessModifiers[_key - 2] = arguments[_key];
    }

    return user.roles.reduce(function (resultPermissions, curRole) {

        var curRolePermissions = securitySchema[curRole] || {};
        var mergedPermissions = accessModifiers.reduce(function (mergeResult, modifier) {
            var _mergeValue;

            var prevPermValue = resultPermissions[modifier];
            var curPermValue = curRolePermissions[modifier] || curRole === "ADMIN" && true || prevPermValue === true && true || false;
            var valueType = typeof curPermValue === "undefined" ? "undefined" : _typeof(curPermValue);

            if (valueType === "function") curPermValue = curPermValue(user);
            if (prevPermValue && (typeof prevPermValue === "undefined" ? "undefined" : _typeof(prevPermValue)) !== (typeof curPermValue === "undefined" ? "undefined" : _typeof(curPermValue))) throw new Error("MixedTypes");

            var mergeValue = void 0;
            switch (valueType) {
                case "object":
                    mergeValue = _extends({}, prevPermValue, curPermValue);
                    break;
                case "function":
                    mergeValue = [];
                    prevPermValue && (_mergeValue = mergeValue).push.apply(_mergeValue, _toConsumableArray(prevPermValue));
                    mergeValue.push(curPermValue);
                    break;
                default:
                    mergeValue = curPermValue;
            }

            return _extends({}, mergeResult, _defineProperty({}, modifier, mergeValue));
        }, {});
        return _extends({}, resultPermissions, mergedPermissions);
    }, {});
};
//# sourceMappingURL=security.js.map