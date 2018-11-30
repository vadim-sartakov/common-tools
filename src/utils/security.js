/**
 * Evaluates result permissions against provided schema
 * @param {Object} user - user object containing "roles" property which has to be array of strings
 * @param {Object} securitySchema 
 * @returns {Object} result permissions
 */
export const getPermissions = (user, securitySchema) => {

    const getActionPermission = (prevPerm, rolePerm) => {

        if (!rolePerm) return false;
        if (prevPerm === true || rolePerm === true) return true;

        const fieldsArray = [];
        prevPerm.fields && fieldsArray.push(prevPerm.fields);
        rolePerm.fields && fieldsArray.push(rolePerm.fields);
        const fields = fieldsArray.join(" ");

        /*const splittedFields = fields.split(" ");
        const exclusiveFields = splittedFields.filter(field => field.startsWith("-"));
        if (splittedFields.length !== exclusiveFields.length) throw new Error("MixedFieldsPermissionsTypes");*/
        
        const entries = prevPerm.entries || [];
        rolePerm.entries && entries.push(rolePerm.entries(user));

        return { fields, entries };

    };

    if (securitySchema.ALL) return securitySchema.ALL;

    return user.roles.reduce(( prevPerm, curRole ) => {
        
        const rolePerm = securitySchema[curRole] || {};
        if (curRole === "ADMIN") return { read: true, modify: true };

        const read = (curRole === "ADMIN_READ" && true) || getActionPermission(prevPerm.read, rolePerm.read);
        const modify = getActionPermission(prevPerm.modify, rolePerm.modify);
        return { read, modify };

    }, { read: false, modify: false });

};