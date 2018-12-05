# Shared tools
Cross-platform framework agnostic functionality which can be used both on client or server.

## Security

Function `getPermissions(user, schema, ...accessModifiers)` simplifies permission management of application.
It's convinient to define all permissions in schema object and reuse it on client and server side. Some application-specific schemas can be also implemented easily. Function returns permission result object containing merged access types properties of all user's roles.

### Use cases
- Server side. Backend controller can check permissions of authenticated user and modify incoming data or adjust database queries depending on user's roles.

- Client side form field access management. Form fields can be hided, made disabled depending on user's roles.
Schema can be shared with backend to check permission on both sides.

- Routes. Either client or server can handle route access permission.

## The default is "deny all" policy. So, anything not permitted will be denied.

## If user has "ADMIN" role, function will return `true` for all requested access modifiers.

### Schema permission values

1. Boolean. `true` value has highest priority, thus if modifier any role has access modifier of `true` value, in result it will be always `true`, no matter what values is in other roles.
2. Object. Plain object will be simply merged across roles.
3. Function. Values can be also functions with `user` argument. Result will be executed and merged across all roles with the same access modifier.

## Examples

### Simple permissions:

```javascript
import { getPermissions } from "shared-tools";

const schema = {
    "MANAGER": { modify: true },
    "USER": { read: true }
};

const user = { username: "user", roles: ["MANAGER", "USER"] };
const permissions = getPermissions(user, schema, "read", "modify");
// permissions === { read: true, modify: true }
```

### Object permission:

```javascript
import { getPermissions } from "shared-tools";

const schema = {
    "MANAGER": { fields: { phoneNumber: 1 } },
    "USER": { fields: { firstName: 1, lastName: 1 } }
};

const user = { username: "user", roles: ["MANAGER", "USER"] };
const permissions = getPermissions(user, schema, "fields");
// permissions === { fields: { firstName: 1, lastName: 1, phoneNumber: 1 } }
```

### Function permission:

```javascript
import { getPermissions } from "shared-tools";

const schema = {
    "MANAGER": { readFilter: { user => ({ department: user.department }) } },
    "USER": { readFilter: { user => ({ username: user.username }) } }
};

const user = {
    username: "user",
    department: "Finance",
    roles: ["MANAGER", "USER"]
};
const permissions = getPermissions(user, schema, "readFilter");
// permissions === { readFilter: [ { department: "Finance" }, { username: "user" } ] }
// Initial "USER" role allows to read only current user's entries
// But "MANAGER" role adds ability to read entries of user's department
```