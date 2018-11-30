/**
 * Evaluates result permissions against provided schema.
 * Result represents merge of all roles grouped by permission keys.
 * Boolean permission has highest priority.
 * Strings result simple array and functions result array of execution results.
 * Mixing permission types is prohibited and throws related error.
 * There are 2 predefined roles: ADMIN (always grants ) and ADMIN_READ
 * @param {Object} user - user object containing "roles" property which has to be array of strings
 * @param {Object} securitySchema - object with roles as keys and permissions as properties.
 * Permission key is arbitrary, property may be simple boolean, string or a function with signature user => {}
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