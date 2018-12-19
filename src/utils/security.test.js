import { expect } from "chai";
import { getPermissions } from "./security";

describe("Security tests", () => {

    it("No permission for specified roles", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = { "ACCOUNTANT": { read: true, update: true } };
        const result = getPermissions(user, schema, "read", "update");
        expect(result).to.be.deep.equal({ read: false, update: false });
    });

    it("Admin", () => {
        const user = { roles: ["ADMIN"] };
        const schema = { "ACCOUNTANT": { read: true, update: true } };
        const result = getPermissions(user, schema, "read", "update");
        expect(result).to.be.deep.equal({ read: true, update: true });
    });

    it("Flat objects", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = { "USER": { read: true }, "MANAGER": { update: true } };
        const result = getPermissions(user, schema, "read", "update");
        expect(result).to.be.deep.equal({ read: true, update: true });
    });

    it("Nested objects", () => {
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
    });

    it("Functions", () => {
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
    });

    it("With master permission (granting full access in the end)", () => {
        const user = { roles: ["USER", "MANAGER", "ACCOUNTANT"] };
        const schema = {
            "USER": { read: { filter: { user: "userId" } } },
            "MANAGER": { read: true },
            "ACCOUNTANT": { read: { filter: { department: "depId" } } }
        };
        const result = getPermissions(user, schema, "read");
        expect(result).to.be.deep.equal({ read: true });
    });

    it("Expanding access property (granting more access) in one of the roles", () => {
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
            read: { projection: "fieldOne fieldTwo fieldThree" },
            update: true
        });
    });

    it("All role with all permissions", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = { "ALL": { all: true } };
        const result = getPermissions(user, schema, "read", "update");
        expect(result).to.be.deep.equal({ read: true, update: true });
    });

    it("Mixing all role with specific", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = { "ALL": { read: true }, "MANAGER": { update: true } };
        const result = getPermissions(user, schema, "read", "update");
        expect(result).to.be.deep.equal({ read: true, update: true });
    });

});