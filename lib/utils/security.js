"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getPermissions = exports.getPermissions = function getPermissions(user, schema) {
  for (var _len = arguments.length, accessKeys = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    accessKeys[_key - 2] = arguments[_key];
  }

  return user.roles.reduce(function (permissions, role) {

    var rolePermissions = schema[role] || schema.ALL || {};
    var mergedAccesses = accessKeys.reduce(function (mergedAccesses, accessKey) {

      var prevPermission = permissions[accessKey];
      var curPermission = rolePermissions[accessKey] || role === "ADMIN" && true || rolePermissions.all || false;
      if (prevPermission && curPermission === false || prevPermission === true) return mergedAccesses;

      if ((typeof curPermission === "undefined" ? "undefined" : _typeof(curPermission)) === "object") {

        // Absense of previous modifier indicates that access has been extended by this particular modifier
        // Setting missing modifier to false
        var curPermissionKeys = Object.keys(curPermission);
        prevPermission && Object.keys(prevPermission).forEach(function (prevPermKey) {
          if (!curPermissionKeys.some(function (curPermKey) {
            return curPermKey === prevPermKey;
          })) {
            curPermission[prevPermKey] = false;
          }
        });

        curPermission = Object.keys(curPermission).reduce(function (mergedAccess, modifierKey) {

          var prevModifier = mergedAccess && mergedAccess[modifierKey];
          var curModifier = curPermission[modifierKey];

          if (prevModifier === false) return mergedAccess;
          if (typeof curModifier === "function") curModifier = curModifier(user);

          var mergedModifier = void 0;
          switch (typeof curModifier === "undefined" ? "undefined" : _typeof(curModifier)) {
            case "object":
              mergedModifier = _extends({}, prevModifier, curModifier);
              break;
            case "string":
              mergedModifier = "" + (prevModifier ? prevModifier + " " : "") + curModifier;
              break;
            default:
              mergedModifier = curModifier;
          }

          return _extends({}, mergedAccess, _defineProperty({}, modifierKey, mergedModifier));
        }, prevPermission || {});
      }

      return _extends({}, mergedAccesses, _defineProperty({}, accessKey, curPermission));
    }, {});
    return _extends({}, permissions, mergedAccesses);
  }, {});
};
//# sourceMappingURL=security.js.map