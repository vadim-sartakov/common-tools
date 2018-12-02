# Shared tools
Cross-platform framework agnostic functionality which can be used both on client or server.

## Security

Function `getPermissions(user, schema)` simplifies permission management of application.
It's convinient to define all permissions in schema object and reuse it on client and server side. Some application-specific schemas can be also implemented easily. Function returns permission result object containing merged access types properties of all user's roles.

### Use cases
- Server side. Backend controller can check permissions of authenticated user and modify incoming data or adjust database queries depending on user's roles.

- Client side form field access management. Form fields can be hided, made disabled depending on user's roles.
Schema can be shared with backend to check permission on both sides.

- Routes. Either client or server can handle route access permission.

## The default is "deny all" policy. So, anything not permitted will be denied.

### Schema permission values

1. Boolean. `true` value has highest priority, thus if any role has `true` access, in result it will be always `true`, no matter what values is in other roles.
2. Object. Plain object will be simply merged across roles.
3. Function. Values can be also functions with `user` argument. Result will be placed in result object and merged into array of values across all roles with the same permission.

## Examples

### Simple permissions:

```javascript
import { getPermissions } from "shared-tools";

const schema = {
    "MANAGER": { modify: true },
    "USER": { read: true }
};

const user = { username: "user", roles: ["MANAGER", "USER"] };
const permissions = getPermissions(user, schema);
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
const permissions = getPermissions(user, schema);
// permissions === { firstName: 1, lastName: 1, phoneNumber: 1 }
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
const permissions = getPermissions(user, schema);
// permissions === { readFilter: [ { department: "Finance" }, { username: "user" } ] }
// Initial "USER" role allows to read only current user's entries
// But "MANAGER" role adds ability to read entries of user's department
```