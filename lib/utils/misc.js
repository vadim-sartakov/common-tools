'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var createProjection = exports.createProjection = function createProjection(projection) {
  var paths = void 0,
      exclusive = void 0,
      mixingTypes = void 0;
  var type = typeof projection === 'undefined' ? 'undefined' : _typeof(projection);
  if (type === 'string') {
    paths = projection.split(' ');
    exclusive = paths[0].startsWith('-');
    mixingTypes = paths.some(function (path) {
      return path.startsWith('-') === !exclusive;
    });
    paths = paths.map(function (path) {
      return exclusive ? path.substring(1) : path;
    });
  } else if (type === 'object') {
    paths = Object.keys(projection);
    exclusive = projection[paths[0]] === 0;
    mixingTypes = paths.some(function (path) {
      return projection[path] === (exclusive ? 1 : 0);
    });
  } else {
    throw new Error('Projection must be either string or object');
  }
  if (mixingTypes) throw new Error('It\'s not allowed to mix inclusive and exclusive paths in projection');
  return { exclusive: exclusive, paths: paths };
};

var shouldRestoreValue = function shouldRestoreValue(fullProperty, _ref) {
  var exclusive = _ref.exclusive,
      paths = _ref.paths;

  return exclusive && paths.indexOf(fullProperty) > -1 || !exclusive && paths.indexOf(fullProperty) === -1 && !paths.some(function (field) {
    return field.startsWith(fullProperty);
  });
};

var shouldProcessObjectRecursively = function shouldProcessObjectRecursively(value, paths, fullProperty) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === "object" && paths.some(function (path) {
    return path.startsWith(fullProperty + ".");
  });
};

var filterObjectRecursively = function filterObjectRecursively(payload) {
  var initialObject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var rootProperty = arguments[2];
  var _ref2 = arguments[3];
  var paths = _ref2.paths,
      exclusive = _ref2.exclusive;

  return Object.keys(payload).reduce(function (prev, payloadProperty) {
    var payloadValue = payload[payloadProperty];
    var mergeValue = initialObject[payloadProperty];
    var fullProperty = '' + (rootProperty ? rootProperty + "." : "") + payloadProperty;
    var result = void 0;
    if (shouldRestoreValue(fullProperty, { paths: paths, exclusive: exclusive })) {
      result = mergeValue;
    } else if (Array.isArray(payloadValue)) {
      result = payloadValue.map(function (payloadItem, index) {
        if (!shouldProcessObjectRecursively(payloadValue, paths, fullProperty)) return payloadItem;
        // Looking row with same id in `initialObject`
        var initialRowObject = mergeValue && mergeValue.find(function (mergeItem) {
          return mergeItem.id === payloadItem.id;
        });
        return filterObjectRecursively(payloadValue[index], initialRowObject, fullProperty, { paths: paths, exclusive: exclusive });
      });
    } else if (shouldProcessObjectRecursively(payloadValue, paths, fullProperty)) {
      result = filterObjectRecursively(payloadValue, mergeValue, fullProperty, { paths: paths, exclusive: exclusive });
    } else {
      result = payloadValue;
    }
    return result !== undefined && _extends({}, prev, _defineProperty({}, payloadProperty, result)) || prev;
  }, {});
};

var filterObject = exports.filterObject = function filterObject(object, projection, initialObject) {
  var newProjection = createProjection(projection);
  return filterObjectRecursively(object, initialObject, "", newProjection);
};
//# sourceMappingURL=misc.js.map