const validateRecursively = (object, rootProperty, validationSchema) => {
    
    

    const objectValue = object[property];

    let result;

    if (Array.isArray(object)) {

    } else if () {

    }

    result = Object.keys(object).reduce((prev, property) => {
        return validateRecursively(object[property], validationSchema[property], validationSchema);
    }, {});

    return result;

};

export const validate = (object, validationSchema) => {
    const errors = validateRecursively(object, "", validationSchema);
    return errors;
};