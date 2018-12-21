export const required = message => value => {
    if (value === undefined ||
            value === null ||
            (value.length !== undefined && value.length === 0) ||
            (typeof(value) === "object" && Object.keys(value).length === 0)) return (message || "Value is required");
    return undefined;
};

export const match = (pattern, message) => value => {
    const regexp = new RegExp(pattern);
    return regexp.test(value) ? undefined : (message || "Value is not valid");
};

const validateRecursively = (object, rootProperty, validationSchema, sourceObject) => {
    
    return Object.keys(object).reduce((prev, property) => {

        const fullProperty = `${rootProperty ? rootProperty + "." : ""}${property}`;
        const value = object[property];
        const validators = validationSchema[property];

        const validationResult = validators.reduce((prev, validator) => {
            const isValid = validator(value, fullProperty, sourceObject);
        }, {});

        /*if (Array.isArray(value)) {
            value.forEach(item => validateRecursively(object, ));
        } else if (typeof(value) === "object") {

        }*/

        return validateRecursively(object[property], validationSchema[property], validationSchema);

    }, {});

};

export const validate = (object, schema, options) => {
    const errors = validateRecursively(object, "", schema, object);
    return errors;
};