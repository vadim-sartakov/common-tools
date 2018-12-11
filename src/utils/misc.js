const shouldRestoreValue = (fullProperty, { exclusive, fields }) => {
    return ( exclusive && fields[fullProperty] === 0 ) ||
            ( !exclusive && fields[fullProperty] === undefined &&
                    !Object.keys(fields).some(field => field.startsWith(fullProperty)) );
};

const shouldProcessObjectRecursively = (value, fields, fullProperty) => {
    return typeof(value) === "object" && Object.keys(fields).some(field => field.startsWith(fullProperty));
};

const filterObjectRecursively = (payload, initialObject = {}, rootProperty, { fields, exclusive }) => {
    return Object.keys(payload).reduce((prev, payloadProperty) => {
        const payloadValue = payload[payloadProperty];
        const mergeValue = initialObject[payloadProperty];
        const fullProperty = `${rootProperty ? rootProperty + "." : ""}${payloadProperty}`;
        let result;
        if ( shouldRestoreValue(fullProperty, { fields, exclusive }) ) {
            result = mergeValue;
        } else if(Array.isArray(payloadValue)) {
            result = payloadValue.map( ( payloadItem, index ) => {
                if (!shouldProcessObjectRecursively(payloadValue, fields, fullProperty)) return payloadItem;
                // Looking row with same id in `initialObject`
                const initialRowObject = mergeValue && mergeValue.find(mergeItem => mergeItem.id === payloadItem.id);
                return filterObjectRecursively(payloadValue[index], initialRowObject, fullProperty, { fields, exclusive });
            });
        } else if ( shouldProcessObjectRecursively(payloadValue, fields, fullProperty) ) {
            result = filterObjectRecursively(payloadValue, mergeValue, fullProperty, { fields, exclusive });
        }  else {
            result = payloadValue;
        }
        return ( result !== undefined && { ...prev, [payloadProperty]: result } ) || prev;
    }, { });
};

const isExclusiveProjection = fields => {
    return fields[Object.keys(fields)[0]] === 0;
};

export const filterObject = (object, fields, initialObject) => {
    const exclusive = isExclusiveProjection(fields);
    return filterObjectRecursively(object, initialObject, "", { fields, exclusive });
};