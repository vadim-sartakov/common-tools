import { expect } from "chai";
import { validate } from "./validate";

describe.skip("Validate", () => {

    it("Pass flat object", () => {
        const object = { firstName: "Bill", lastName: "Gates" };
        const schema = {
            firstName: value => value === "Bill",
            lastName: value => value === "Gates"
        };
        const result = validate(object, schema);
        expect(result).to.deep.equal({ });
    });

    it("Fail flat object", () => {
        const object = { firstName: "Bill", lastName: "Gates" };
        const schema = {
            firstName: { validator: value => value !== "Bill", message: "" },
            lastName: value => value !== "Gates"
        };
        const result = validate(object, schema);
    });

});