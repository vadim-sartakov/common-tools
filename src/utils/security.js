export const getPermissions = (user, securitySchema) => {

    return user.roles.reduce(( resultPermissions, curRole ) => {

        const curRolePermissions = securitySchema[curRole] || { };
        const mergedPermissions = Object.keys(curRolePermissions).reduce((mergeResult, modifier) => {

            const prevPerm = resultPermissions[modifier];
            const curPerm = curRolePermissions[modifier] || { };

            if (prevPerm && typeof(curPerm) !== "function" && typeof(prevPerm) !== typeof(curPerm)) throw new Error("MixedTypes");

            let mergeValue;
            switch (typeof(curPerm)) {
                case "object":
                    mergeValue = { ...prevPerm, ...curPerm };
                    break;
                case "function":
                    mergeValue = [];
                    prevPerm && mergeValue.push(...prevPerm);
                    mergeValue.push(curPerm(user));
                    break;
                default:
                    mergeValue = curPerm;
            }

            return { [modifier]: mergeValue };

        }, { });
        return { ...resultPermissions, ...mergedPermissions };
    }, { });

};