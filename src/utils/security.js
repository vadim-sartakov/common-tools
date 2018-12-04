export const getPermissions = (user, securitySchema, ...access) => {

    return user.roles.reduce(( resultPermissions, curRole ) => {

        const curRolePermissions = securitySchema[curRole] || { };
        const mergedPermissions = Object.keys(curRolePermissions).reduce((mergeResult, modifier) => {

            const prevPerm = resultPermissions[modifier];
            let curPerm = curRolePermissions[modifier];
            const valueType = typeof(curPerm);

            if (valueType === "function") curPerm = curPerm(user);
            if (prevPerm && typeof(curPerm) !== "function" && typeof(prevPerm) !== typeof(curPerm)) throw new Error("MixedTypes");

            let mergeValue;
            switch (valueType) {
                case "object":
                    mergeValue = { ...prevPerm, ...curPerm };
                    break;
                case "function":
                    mergeValue = [];
                    prevPerm && mergeValue.push(...prevPerm);
                    mergeValue.push(curPerm);
                    break;
                default:
                    mergeValue = curPerm;
            }

            return { [modifier]: mergeValue };

        }, { });
        return { ...resultPermissions, ...mergedPermissions };
    }, { });

};