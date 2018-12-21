import { expect } from "chai";
import { validate, required, match } from "./validator";

describe("Validator", () => {

    describe("Validators", () => {

        describe("Required", () => {

            const validator = required();

            it("Not empty string", () => {
                expect(validator("Bill")).not.to.be.ok;
            });

            it("Zero", () => {
                expect(validator(0)).not.to.be.ok;
            });

            it("Not empty array", () => {
                expect(validator(["1"])).not.to.be.ok;
            });

            it("Not empty object", () => {
                expect(validator({ key: "value" })).not.to.be.ok;
            });

            it("Undefined with message", () => {
                expect(validator(undefined)).to.equal("Value is required");
            });

            it("Null with custom message", () => {
                const customValidator = required("Custom message");
                expect(customValidator(null)).to.equal("Custom message");
            });

            it("Empty string", () => {
                expect(validator("")).to.be.ok;
            });

            it("Empty array", () => {
                expect(validator([])).to.be.ok;
            });

            it("Empty object", () => {
                expect(validator({ })).to.be.ok;
            });

        });

        describe("Match", () => {

            it("Correct", () => {
                const validator = match(/\w+/);
                expect(validator("Bill")).not.to.be.ok;
            });

            it("Fail", () => {
                const validator = match(/w+/);
                expect(validator("-+*")).to.equal("Value is not valid");
            });

            it("Fail with custom message", () => {
                const validator = match(/w+/, "Custom message");
                expect(validator("-+*")).to.equal("Custom message");
            });

        });

    });

    describe.skip("Validate", () => {

        it("Pass flat object", () => {
            const object = { firstName: "Bill", lastName: "Gates" };
            const schema = { firstName: required(), lastName: required() };
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

});