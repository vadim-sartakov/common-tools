import { expect } from "chai";
import { getPermissions } from "./security";

describe("Security tests", () => {

    it("No permission for specified roles", () => {
        const result = getPermissions(["USER", "MANAGER"], { "ADMIN": { read: true, modify: true } });
        expect(result).to.be.deep.equal({ });
    });

    it("Single role", () => {        
        const result = getPermissions(["USER"], { "USER": { read: true, modify: true } });
        expect(result).to.be.deep.equal({ read: true, modify: true });
    });

    it("With 'ALL' role", () => {
        const schema = {
            "ALL": { read: true, modify: true },
            "MODERATOR": {
                read: { entries: () => {} },
                modify: { fields: "field" }
            }
        };   
        const result = getPermissions(["USER"], schema);
        expect(result).to.be.deep.equal({ read: true, modify: true });
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
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result).to.be.deep.equal({ read: true, modify: true });
    });

    it("Mixing roles with inclusive fields", () => {
        const schema = {
            "USER": { read: { fields: "fieldOne fieldTwo" } },
            "MODERATOR": { read: { fields: "fieldThree" } }
        };
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result).to.deep.equal({ field: "fieldOne fieldTwo fieldThree" });
    });

    it("Mixing roles with exclusive fields", () => {
        const schema = {
            "USER": { read: { fields: "-fieldOne -fieldTwo" } },
            "MODERATOR": { read: { fields: "-fieldThree" } }
        };
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result).to.deep.equal({ field: "-fieldOne -fieldTwo -fieldThree" });
    });

    it("Mixing roles with inclusive and exclusive fields", () => {
        const schema = {
            "USER": { read: { fields: "-fieldOne" } },
            "MODERATOR": { read: { fields: "fieldThree" } }
        };
        expect(getPermissions(["USER", "MODERATOR"], schema)).to.throw("MixedFieldsPermissionsTypes");
    });

    it("Mixing roles with different functions", () => {
        const schema = {
            "USER": { read: { entries: user => ({ user }) } },
            "MODERATOR": { read: { entries: user => ({ department: user.department }) } }
        };   
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result.read).to.have.nested.property("result.read.entries");
        expect(result.read.entries.length).to.equal(2);
        const firstFunction = result.read.entries[0];
        expect(typeof(firstFunction)).to.equal("function");
        expect(firstFunction("user")).to.deep.equal({ user: "user" });

        const secondFunction = result.read.entries[0];
        expect(typeof(secondFunction)).to.equal("function");
        expect(secondFunction({ department: "department" })).to.deep.equal({ department: "department" });
    });

});