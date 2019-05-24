export const createProjection = projection => {
  let paths, exclusive, mixingTypes;
  const type = typeof (projection);
  if (type === 'string') {
    paths = projection.split(' ');
    exclusive = paths[0].startsWith('-');
    mixingTypes = paths.some(path => path.startsWith('-') === !exclusive);
    paths = paths.map(path => exclusive ? path.substring(1) : path);
  } else if (type === 'object') {
    paths = Object.keys(projection);
    exclusive = projection[paths[0]] === 0;
    mixingTypes = paths.some(path => projection[path] === (exclusive ? 1 : 0));
  } else {
    throw new Error('Projection must be either string or object');
  }
  if (mixingTypes) throw new Error('It\'s not allowed to mix inclusive and exclusive paths in projection');
  return { exclusive, paths };
};

const shouldRestoreValue = (fullProperty, { exclusive, paths }) => {
  return (exclusive && paths.indexOf(fullProperty) > -1) ||
    (!exclusive && paths.indexOf(fullProperty) === -1 &&
      !paths.some(field => field.startsWith(fullProperty)));
};

const shouldProcessObjectRecursively = (value, paths, fullProperty) => {
  return value !== null && typeof (value) === "object" && paths.some(path => path.startsWith(fullProperty + "."));
};

const filterObjectRecursively = (payload, initialObject = {}, rootProperty, { paths, exclusive }) => {
  return Object.keys(payload).reduce((prev, payloadProperty) => {
    const payloadValue = payload[payloadProperty];
    const mergeValue = initialObject[payloadProperty];
    const fullProperty = `${rootProperty ? rootProperty + "." : ""}${payloadProperty}`;
    let result;
    if (shouldRestoreValue(fullProperty, { paths, exclusive })) {
      result = mergeValue;
    } else if (Array.isArray(payloadValue)) {
      result = payloadValue.map((payloadItem, index) => {
        if (!shouldProcessObjectRecursively(payloadValue, paths, fullProperty)) return payloadItem;
        // Looking row with same id in `initialObject`
        const initialRowObject = mergeValue && mergeValue.find(mergeItem => mergeItem.id === payloadItem.id);
        return filterObjectRecursively(payloadValue[index], initialRowObject, fullProperty, { paths, exclusive });
      });
    } else if (shouldProcessObjectRecursively(payloadValue, paths, fullProperty)) {
      result = filterObjectRecursively(payloadValue, mergeValue, fullProperty, { paths, exclusive });
    } else {
      result = payloadValue;
    }
    return (result !== undefined && { ...prev, [payloadProperty]: result }) || prev;
  }, {});
};

export const filterObject = (object, projection, initialObject) => {
  const newProjection = createProjection(projection);
  return filterObjectRecursively(object, initialObject, "", newProjection);
};