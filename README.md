# Shared tools
Cross-platform framework agnostic useful set of tools which can be used on client or server.

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
const object = { first: "1", second: "2", third: "3" };

const removeResult = filterObject(object, { first: 0 });
expect(removeResult).to.deep.equal({ second: "2", third: "3" });

const mergeResult = filterObject(object, { first: 0 }, { first: "111" });
expect(mergeResult).to.deep.equal({ first: "111", second: "2", third: "3" });

```

### Nested objects
```javascript
const object = { nested: { first: "1", second: "2", third: "3" } };
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

## Validator
`validate` function performs schema-based validation.

```javascript
const object = { };
                    // required is one of the the default validator function
                    // validators chain could be specified with array
const schema = { firstName: required(), lastName: required() };
expect(validate(object, schema)).to.deep.equal({
  "firstName": "Value is required",
  "lastName": "Value is required",
});
```

## Custom validator

Since every validator is a simple function, one could easily define a custom one. The function signature is: `(value, path, allValues) => string`. If value is valid, `undefined` should be returned, if it's not, error string message should be provided. If complex object is validating (e.g. array or plain object), error object could be returned.

### Async validation
Any validator of schema can be asynchronous. In that case, `validate` function returns `Promise`.

### Root validation
Some validators are not related to some specific field. In that case there is special `_root` schema property could be provided. Custom roor validators should always return property-errorMessage object.

### Default validators

Each function returns configured validator which conforms the validation contract function. Message could be either plain string or function with signature `(key, path, value) => string`. This callback is useful when custom message format logic is required.

- `required(message)`. Checks if value is not null, undefined, length is not 0 (if array or string).
- `match(regex, message)`. Tests provided string against regular expression. Could be string or plain js regex object.
- `min(value, message)`. Checks if value is less than or equal to the provided one. Value could be number, date, string or array (lengths are compared).
- `max(value, message)`. Checks if value is more than or equal to provided one. Args the same as of `min` validator.
- `array(reducer, reducerInitialValue, validator, childrenProperty)`.
- `unique(comparator, message, childrenProperty)`. Compares array elements utilizing provided comparator. If no comparator specified, then simple `===` will be used. If `childrenProperty` is specified, then processing goes recursively.

#### Simple elements

```javascript
const validator = unique();
const array = ["1", "2", "1"];
expect(validator(array, "array")).to.deep.equal({
  "array[0]": "Value is not unique",
  "array[2]": "Value is not unique"
});
```

#### Complex objects

```javascript
const validator = unique((x, y) => x.id === y.id);
const array = [{ id: "1"} , { id: "2" }, { id: "1"}];
expect(validator(array, "array")).to.deep.equal({
  "array[0]": "Value is not unique",
  "array[2]": "Value is not unique",
});
```

#### Tree
```javascript
const validator = unique((x, y) => x.code === y.code, null, "children");
const tree = [
  { id: "1", code: "8", children: [
    { id: "2", code: "1" }
  ] },
  { id: "3", code: "2", children: [
    { id: "4", code: "1", children: [
      {id: "5", code: "1"}
    ] }
  ] },
  { id: "6", code: "5" }
];
expect(validator(tree, "tree")).to.deep.equal({
  "tree[0].children[0]": "Value is not unique",
  "tree[1].children[0]": "Value is not unique",
  "tree[1].children[0].children[0]": "Value is not unique",
});
```

### But there are plenty of validation libraries!

Indeed. But almost all of them are framework-specific, focused on one side of application (back or front) or hard to tweak. This library is simple, framework agnostic and intended to be used both on client and server side and has convinient tools to validate arrays and trees. It relies on magic-free and straightforward pure functions-driven approach.
The closest library to this one is `validator.js`. But syntax and customisation is a bit redundant, bloated with library specific syntax, it has global state management and it arrays support is limited.

## Projection
`projection(definition)` is used to verify and convert provided projection to object to unify the definition. Projection could be specified as string or as object.

Both inclusive definitions

- `projection("id name")`
- `projection({ id: 1, name: 1 })` 

will produce `{ isExclusive: false, paths: ['id', 'name'] }`

- `projection("-id -name")`
- `projection({ id: 0, name: 0 })`

will produce `{ isExclusive: true, paths: ['id', 'name'] }`

It is not allowed to mix inclusive and exclusive definitions.