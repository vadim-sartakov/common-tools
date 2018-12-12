const validateRecursively = (object, rootProperty, validationSchema, sourceObject) => {
    
    return Object.keys(object).reduce((prev, property) => {

        const fullProperty = `${rootProperty ? rootProperty + "." : ""}${property}`;
        const value = object[property];
        const validators = validationSchema[property];

        const validationResult = validators.reduce((prev, validator) => {
            const isValid = validator(value, fullProperty, sourceObject);
        }, {});

        if (Array.isArray(value)) {
            value.forEach(item => validateRecursively(object, ));
        } else if (typeof(value) === "object") {

        }

        return validateRecursively(object[property], validationSchema[property], validationSchema);

    }, {});

};

export const validate = (object, schema) => {
    const errors = validateRecursively(object, "", schema, object);
    return errors;
};