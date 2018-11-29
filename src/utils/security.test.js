//import { expect } from "chai";
import { getPermissions } from "./security";

describe("Security tests", () => {

    it("No permission for specified roles", () => {
        const result = getPermissions(["USER", "MANAGER"], { "ADMIN": { read: true, modify: true } });
        //expect(result).to.be.deep.equal({});
    });

    it("Single role", () => {

        //const schema = { "ADMIN": { read: { entries: res => 1, fields: res => 1 } } };

    });

    it("Mixing roles with inclusive exclusive fields", () => {

    });

});