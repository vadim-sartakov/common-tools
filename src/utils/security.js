export const getPermissions = (user, schema, ...accessKeys) => {

    return user.roles.reduce((permissions, role) => {

        const rolePermissions = schema[role] || schema.ALL || { };
        const mergedAccesses = accessKeys.reduce((mergedAccesses, accessKey) => {

            const prevPermission = permissions[accessKey];
            let curPermission = rolePermissions[accessKey] || (role === "ADMIN" && true) || rolePermissions.all || false;
            if ((prevPermission && curPermission === false) || prevPermission === true) return mergedAccesses;
            
            if (typeof(curPermission) === "object") {

                // Absense of previous modifier indicates that access has been extended by this particular modifier
                // Setting missing modifier to false
                const curPermissionKeys = Object.keys(curPermission);
                prevPermission && Object.keys(prevPermission).forEach(prevPermKey => {
                    if (!curPermissionKeys.some(curPermKey => curPermKey === prevPermKey)) {
                        curPermission[prevPermKey] = false;
                    }
                });

                curPermission = Object.keys(curPermission).reduce((mergedAccess, modifierKey) => {

                    const prevModifier = mergedAccess && mergedAccess[modifierKey];
                    let curModifier = curPermission[modifierKey];

                    if (prevModifier === false) return mergedAccess;
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

            return { ...mergedAccesses, [accessKey]: curPermission };

        }, { });
        return { ...permissions, ...mergedAccesses };
    }, { });

};