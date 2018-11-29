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

    it("Mixed roles ", () => {
        const schema = {
            "USER": { read: { entries: user => ({ user }), fields: "field" }, modify: true },
            "MODERATOR": { read: true, modify: { fields: "field" } }
        };   
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result).to.be.deep.equal({ read: true, modify: true });
    });

    it("With 'ALL' role and without required one", () => {
        const schema = {
            "ALL": { read: true, modify: true },
            "MODERATOR": { read: { entries: () => {} }, modify: { fields: "field" } }
        };   
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result).to.be.deep.equal({ read: true, modify: true });
    });

    // it("With 'ALL' role and required one", () => {
    //     const schema = {
    //         "ALL": { read: true, modify: true },
    //         "MODERATOR": { read: { entries: () => {} }, modify: { fields: "field" } }
    //     };   
    //     const result = getPermissions(["USER", "MODERATOR"], schema);
    //     expect(result).to.be.deep.equal({ read: true, modify: true });
    // });

    it("Mixing roles with inclusive and exclusive fields", () => {
        
    });

    it("Mixing roles with different functions", () => {
        const schema = {
            "USER": { read: { entries: user => ({ user: "user" }) } },
            "MODERATOR": { read: { entries: user => ({ department: "department" }) } }
        };   
        const result = getPermissions(["USER", "MODERATOR"], schema);
        expect(result).to.deep.equal({ read: { entries: [ { user: "user" }, { department: "department" } ] } });
    });

});