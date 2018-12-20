# Shared tools
Cross-platform framework agnostic functionality which can be used both on client or server.

## Security

Function `getPermissions` simplifies permission management of application.
It's convinient to define all permissions in schema object and reuse it on client and server side. Some application-specific schemas can be also implemented easily.

Arguments:
- user - Object - plain object with "roles" property which is a simple array of strings
- schema - Object - object describing permission by roles
- ...accessKeys - String - requested access list to get from user roles

Returns - permission result object containing merged access types properties of all user's roles

### Use cases
- Server side. Backend controller can check permissions of authenticated user and modify incoming data or adjust database queries depending on user's roles.

- Client side form field access management. Form fields can be hided, made disabled depending on user's roles.
Schema can be shared with backend to check permission on both sides.

- Routes. Either client or server can handle route access permission.

### The default is "deny all" policy. So, anything not permitted will be denied.

### 

## Examples

### Simple permissions.
`true` permission value has always highest priority. If there are other values (such as objects) and `true`, result will be always `true`.

```javascript
const user = { roles: ["USER", "MANAGER"] };
const schema = { "USER": { read: true, update: { projection: "field" } }, "MANAGER": { update: true } };
const result = getPermissions(user, schema, "read", "update");
expect(result).to.be.deep.equal({ read: true, update: true });
```

### Nested objects
Plain objects will be merged, strings joined with space.
```javascript
const user = { roles: ["USER", "MANAGER"] };
const schema = {
    "USER": {
        read: { filter: { user: "userId" }, projection: "fieldOne" }
    },
    "MANAGER": {
        read: { filter: { department: "depId" }, projection: "fieldTwo" },
        update: true
    }
};
const result = getPermissions(user, schema, "read", "update");
expect(result).to.be.deep.equal({
    read: {
        filter: { user: "userId", department: "depId" },
        projection: "fieldOne fieldTwo"
    },
    update: true
});
```

### Expanding access modifier in one of the role
There are cases when some role describes spicific access modifiers and other role don't have such retricted access. In that case, expanded modifier will have `false` value.

```javascript
const user = { roles: ["USER", "MANAGER", "ACCOUNTANT"] };
const schema = {
    "USER": {
        read: { filter: { user: "userId" }, projection: "fieldOne" }
    },
    "MANAGER": {
        read: { projection: "fieldTwo" },
        update: true
    },
    "ACCOUNTANT": {
        read: { filter: { department: "depId" }, projection: "fieldThree" },
        update: true
    }
};
const result = getPermissions(user, schema, "read", "update");
expect(result).to.be.deep.equal({
    read: { filter: false, projection: "fieldOne fieldTwo fieldThree" },
    update: true
});
```

### Functions
Permission value could also be function. It's used as callback, executes with `user` argument and it should return permission value.
```javascript
const user = { id: "userId", roles: ["USER", "MANAGER"] };
const schema = {
    "USER": {
        read: {
            filter: user => ({ user: user.id })
        }
    }
};
const result = getPermissions(user, schema, "read");
expect(result).to.be.deep.equal({
    read: {
        filter: { user: "userId" }
    }
});
```

### Admin
If user has "ADMIN" role, function will return `true` for all requested access modifiers.

```javascript
const user = { roles: ["ADMIN"] };
const schema = { "ACCOUNTANT": { read: true, update: true } };
const result = getPermissions(user, schema, "read", "update");
expect(result).to.be.deep.equal({ read: true, update: true });
```

### Special "ALL" role
`ALL` role simplifies generic permission definition. Any specific permission will be always merged with "ALL".
```javascript
const user = { roles: ["USER", "MANAGER"] };
const schema = { "ALL": { read: true, update: true } };
const result = getPermissions(user, schema, "read", "update");
expect(result).to.be.deep.equal({ read: true, update: true });
```

### Special "all" access
Simplifies repetitive access definition
```javascript
const user = { roles: ["USER", "MANAGER"] };
const schema = { "MANAGER": { all: true } };
const result = getPermissions(user, schema, "read", "update");
expect(result).to.be.deep.equal({ read: true, update: true });
```

## Object filter
`filterObject` utility intended to blacklist or whitelist set of properties and filter specified object accordingly.

Arguments:
- object - object to filter
- fields - projection object with full properties path as keys and 0/1 as values. It is allowed to use nested properties and array properties as well.
- initialObject - object to take values from. If property should be filtered according to projection, initial value from this object is taken. To correctly restore array element value, rows should contain unique `id` properties. This paramater is not required. If not specified, filtered properties will be removed.

## Examples

### Flat objects
```javascript
const removeResult = filterObject(object, { first: 0 });
expect(removeResult).to.deep.equal({ second: "2", third: "3" });

const mergeResult = filterObject(object, { first: 0 }, { first: "111" });
expect(mergeResult).to.deep.equal({ first: "111", second: "2", third: "3" });

```

### Nested objects
```javascript
const result = filterObject(object, { "nested.first": 0 });
expect(result).to.deep.equal({ nested: { second: "2", third: "3" } });
```

### Remove arrays properties
```javascript
const object = { array: [
    { id: 0, first: "1", second: "1" },
    { id: 1, first: "2", second: "2" },
    { id: 2, first: "3", second: "3" },
]};
const filterResult = filterObject(object, { "array.first": 0 });
expect(filterResult).to.deep.equal({ array: [
    { id: 0, second: "1" },
    { id: 1, second: "2" },
    { id: 2, second: "3" },
]});
```

### Merge array rows
If field is excluded by projection and merged with some value, function will restore field values from objectToMerge (3-rd argument)
```javascript

// Initial object
const object = { array: [
    { id: 0, first: "1", second: "1" },
    { id: 1, first: "2", second: "2" },
    { id: 2, first: "3", second: "3" },
]};
                            // Field is prohibited to modify    This is initial value to take values from
const mergeResult = filterObject(object, { "array.first": 0 }, { array: [
    { id: 0, first: "111", second: "1" },
    { id: 1, first: "2", second: "2" },
    { id: 2, first: "3", second: "333" },
]});
expect(mergeResult).to.deep.equal({ array: [
            // Value restored since it's not allowed to modify
    { id: 0, first: "111", second: "1" },
    { id: 1, first: "2", second: "2" },
                            // This value was successfully changed
    { id: 2, first: "3", second: "3" },
]});
```
