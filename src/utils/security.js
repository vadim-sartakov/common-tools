export const getPermissions = (user, schema, ...accessKeys) => {

    return user.roles.reduce((permissions, role) => {

        const rolePermissions = schema[role] || schema.ALL || { };
        const mergedAccesses = accessKeys.reduce((mergedAccesses, accessKey) => {

            const prevPermission = permissions[accessKey];
            let permission = rolePermissions[accessKey] || (role === "ADMIN" && true) || rolePermissions.all || false;
            if ((prevPermission && permission === false) || prevPermission === true) return mergedAccesses;
            
            if (typeof(permission) === "object") {

                // Absense of previous modifier indicates that access has been extended by this particular modifier
                /*const initialMergedAccess = (prevPermission && Object.keys(prevPermission).reduce((prev, key) => {
                    return Object.keys(permission).some(permKey => permKey === key) ? { ...prev, key } : prev;
                }), { }) || { };*/

                permission = Object.keys(permission).reduce((mergedAccess, modifierKey) => {

                    const prevModifier = mergedAccess && mergedAccess[modifierKey];
                    let curModifier = permission[modifierKey];

                    if (typeof(curModifier) === "function") curModifier = curModifier(user);

                    let mergedModifier;
                    switch(typeof(curModifier)) {
                        case "object":
                            mergedModifier = { ...prevModifier, ...curModifier };
                            break;
                        case "string":
                            mergedModifier = `${prevModifier ? prevModifier + " " : ""}` + curModifier;
                            break;
                        default:
                            mergedModifier = curModifier;
                    }

                    return { ...mergedAccess, [modifierKey]: mergedModifier };

                }, prevPermission || {});
            }

            return { ...mergedAccesses, [accessKey]: permission };

        }, { });
        return { ...permissions, ...mergedAccesses };
    }, { });

};