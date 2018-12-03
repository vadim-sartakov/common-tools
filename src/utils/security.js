export const getPermissions = (user, securitySchema) => {

    return user.roles.reduce(( resultPermissions, curRole ) => {

        const curRolePermissions = securitySchema[curRole] || { };
        const mergedPermissions = Object.keys(curRolePermissions).reduce((mergeResult, modifier) => {

            const prevPerm = resultPermissions[modifier];
            const curPerm = curRolePermissions[modifier] || { };
            if (prevPerm && typeof(prevPerm) !== typeof(curPerm)) throw new Error("MixedTypes");

            let mergeValue;
            switch (typeof(curPerm)) {
                case "object":
                    mergeValue = { ...curPerm };
                    break;
                case "function":
                    mergeValue = curPerm(user);
                    break;
                default:
                    mergeValue = curPerm;
            }

            return { ...prevPerm, [modifier]: mergeValue };

        }, { });
        return { ...resultPermissions, ...mergedPermissions };
    }, { });

};