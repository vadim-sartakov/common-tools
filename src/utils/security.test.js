import { expect } from "chai";
import { getPermissions } from "./security";

describe("Security tests", () => {

    it("No permission for specified roles", () => {
        const result = getPermissions({ roles: ["USER", "MANAGER"] }, { "ACCOUNTANT": { read: true, modify: true } });
        expect(result).to.be.deep.equal({ read: false, modify: false });
    });

    it("Single role", () => {        
        const result = getPermissions({ roles: ["USER"] }, { "USER": { read: true, modify: true } });
        expect(result).to.deep.equal({ read: true, modify: true });
    });

    it("Admin user", () => {
        const schema = { "USER": { read: { fields: "fieldOne" } } };
        const result = getPermissions({ roles: ["ADMIN"] }, schema);
        expect(result).to.deep.equal({ read: true, modify: true });
    });

    it("Admin read user", () => {
        const schema = { "USER": { read: { fields: "fieldOne" } } };
        const result = getPermissions({ roles: ["ADMIN_READ"] }, schema);
        expect(result).to.deep.equal({ read: true, modify: false });
    });

    it("With 'ALL' role", () => {
        const schema = {
            "ALL": { read: true, modify: true },
            "MODERATOR": {
                read: { entries: () => {} },
                modify: { fields: "field" }
            }
        };   
        const result = getPermissions({ roles: ["USER"] }, schema);
        expect(result).to.deep.equal({ read: true, modify: true });
    });

    it("Mixed roles", () => {
        const schema = {
            "USER": { 
                read: { entries: user => ({ user }), fields: "field" },
                modify: true
            },
            "MODERATOR": {
                read: true,
                modify: { fields: "field" }
            }
        };   
        const result = getPermissions({ roles: ["USER", "MODERATOR"] }, schema);
        expect(result).to.deep.equal({ read: true, modify: true });
    });

    it("Mixing roles with inclusive fields", () => {
        const schema = {
            "USER": { read: { fields: "fieldOne fieldTwo" } },
            "MODERATOR": { read: { fields: "fieldThree" } }
        };
        const result = getPermissions({ roles: ["USER", "MODERATOR"] }, schema);
        expect(result).to.deep.equal({ read: { fields: "fieldOne fieldTwo fieldThree", entries: [] }, modify: false });
    });

    it("Mixing roles with exclusive fields", () => {
        const schema = {
            "USER": { read: { fields: "-fieldOne -fieldTwo" } },
            "MODERATOR": { read: { fields: "-fieldThree" } }
        };
        const result = getPermissions({ roles: ["USER", "MODERATOR"] }, schema);
        expect(result).to.deep.equal({ read: { fields: "-fieldOne -fieldTwo -fieldThree", entries: [] }, modify: false });
    });

    it("Mixing roles with different functions", () => {
        const schema = {
            "USER": { read: { entries: user => ({ user: user.id }) } },
            "MODERATOR": { read: { entries: user => ({ department: user.department }) } }
        };   
        const result = getPermissions({ id: "user", roles: ["USER", "MODERATOR"], department: "department" }, schema);
        expect(result).to.have.nested.property("read.entries");
        const { entries } = result.read;
        expect(entries).instanceOf(Array);
        expect(entries.length).to.equal(2);
        expect(entries[0]).to.deep.equal({ user: "user" });
        expect(entries[1]).to.deep.equal({ department: "department" });
    });

});