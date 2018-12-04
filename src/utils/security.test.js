import { expect } from "chai";
import { getPermissions } from "./security";

describe("Security tests", () => {

    it("No permission for specified roles", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = { "ACCOUNTANT": { read: true, modify: true } };
        const result = getPermissions(user, schema, "read", "modify");
        expect(result).to.be.deep.equal({ read: false, modify: false });
    });

    it("Boolean", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = { "USER": { read: true }, "MANAGER": { modify: true } };
        const result = getPermissions(user, schema, "read", "modify");
        expect(result).to.be.deep.equal({ read: true, modify: true });
    });

    it("Admin", () => {
        const user = { roles: ["MANAGER", "ADMIN"] };
        const schema = { "USER": { read: true } };
        const result = getPermissions(user, schema, "read", "modify");
        expect(result).to.be.deep.equal({ read: true, modify: true });
    });

    it("Object", () => {
        const user = { roles: ["USER", "MANAGER"] };
        const schema = {
            "USER": { fields: { firstName: 1, lastname: 1 } },
            "MANAGER": { fields: { phoneNumber: 1 } }
        };
        const result = getPermissions(user, schema, "fields");
        expect(result).to.be.deep.equal({ fields: { firstName: 1, lastname: 1, phoneNumber: 1 } });
    });

    it("Function", () => {
        const user = { id: "user", roles: ["USER", "MODERATOR"], department: "department" };
        const schema = {
            "USER": { readFilter: user => ({ user: user.id }) },
            "MODERATOR": { readFilter: user => ({ department: user.department }) }
        };
        const result = getPermissions(user, schema, "readFilter");
        expect(result).to.deep.equal({ readFilter: [{ user: "user" }, { department: "department" }] });
    });

    it("Object and boolean", () => {
        const user = { roles: ["USER", "MODERATOR"] };
        const schema = {
            "USER": { fields: { firstName: 1, lastName: 1 } },
            "MODERATOR": { fields: { phoneNumber: 1 }, read: true }
        };
        const result = getPermissions(user, schema, "fields", "read");
        expect(result).to.deep.equal({
            fields: { firstName: 1, lastName: 1, phoneNumber: 1 },
            read: true
        });
    });

    it("Mixing different types", () => {
        const user = { id: "user", roles: ["USER", "MODERATOR"], department: "department" };
        const schema = {
            "USER": { read: true },
            "MODERATOR": { read: user => ({ department: user.department }) }
        };
        expect(() => getPermissions(user, schema, "read")).to.throw("MixedTypes");
    });

});