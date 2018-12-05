export const getPermissions = (user, securitySchema, ...accessModifiers) => {

    return user.roles.reduce((resultPermissions, curRole) => {

        const curRolePermissions = securitySchema[curRole] || { };
        const mergedPermissions = accessModifiers.reduce((mergeResult, modifier) => {

            const prevPermValue = resultPermissions[modifier];
            let curPermValue = curRolePermissions[modifier] ||
                (curRole === "ADMIN" && true) ||
                (prevPermValue === true && true) ||
                false;
            const valueType = typeof(curPermValue);

            if (valueType === "function") curPermValue = curPermValue(user);
            if (prevPermValue && typeof(prevPermValue) !== typeof(curPermValue)) throw new Error("MixedTypes");

            let mergeValue;
            switch (valueType) {
                case "object":
                    mergeValue = { ...prevPermValue, ...curPermValue };
                    break;
                case "function":
                    mergeValue = [];
                    prevPermValue && mergeValue.push(...prevPermValue);
                    mergeValue.push(curPermValue);
                    break;
                default:
                    mergeValue = curPermValue;
            }

            return { ...mergeResult, [modifier]: mergeValue };

        }, { });
        return { ...resultPermissions, ...mergedPermissions };
    }, { });

};