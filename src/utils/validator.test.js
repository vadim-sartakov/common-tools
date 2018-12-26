import { expect } from "chai";
import { validate, required, match, min, max, unique } from "./validator";

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

        describe("Min", () => {

            it("No value", () => {
                const validator = min(5);
                expect(validator()).not.to.be.ok;
            });

            it("Valid", () => {
                const validator = min(5);
                expect(validator(8)).not.to.be.ok;
                expect(validator(8.45)).not.to.be.ok;
                expect(validator([1, 2, 3, 4, 5])).not.to.be.ok;
                expect(validator("abcdefghi")).not.to.be.ok;
                expect(validator("123456789")).not.to.be.ok;
            });

            it("Invalid", () => {
                const validator = min(5);
                const error = "Should be at least 5";
                expect(validator(2)).to.equal(error);
                expect(validator(2.45)).to.equal(error);
                expect(validator([1, 2])).to.equal(error);
                expect(validator("ab")).to.equal(error);
                expect(validator("12")).to.equal(error);
            });

            it("Custom message", () => {
                const error = "Custom";
                const validator = min(5, error);
                expect(validator(2)).to.equal(error);
                expect(validator(2.45)).to.equal(error);
                expect(validator([1, 2])).to.equal(error);
                expect(validator("ab")).to.equal(error);
            });

        });

        describe("Max", () => {

            it("Valid", () => {
                const validator = max(5);
                expect(validator(2)).not.to.be.ok;
                expect(validator(2.45)).not.to.be.ok;
                expect(validator([1, 2])).not.to.be.ok;
                expect(validator("ab")).not.to.be.ok;
                expect(validator("12")).not.to.be.ok;
            });

            it("Invalid", () => {
                const error = "Should be not more than 5";
                const validator = max(5);
                expect(validator(8)).to.equal(error);
                expect(validator(8.45)).to.equal(error);
                expect(validator([1, 2, 3, 4, 5, 6])).to.equal(error);
                expect(validator("abcdefghi")).to.equal(error);
                expect(validator("123456789")).to.equal(error);
            });

            it("Custom message", () => {
                const error = "Custom";
                const validator = max(5, "Custom");
                expect(validator(8)).to.equal(error);
                expect(validator(8.45)).to.equal(error);
                expect(validator([1, 2, 3, 4, 5, 6])).to.equal(error);
                expect(validator("abcdefghi")).to.equal(error);
                expect(validator("123456789")).to.equal(error);
            });

        });

        describe("Unique", () => {

            it("Valid", () => {
                const validator = unique();
                expect(validator("1", "array[0]", { array: ["1", "2"] })).not.to.be.ok;
            });

            it("Invalid", () => {
                const validator = unique();
                expect(validator("1", "array[0]", { array: ["1", "2", "1", "2"] })).to.equal("Value is not unique");
                expect(validator("2", "array[0]", { array: ["1", "2", "1", "2"] })).to.equal("Value is not unique");
            });

            it("Mixed", () => {
                const validator = unique();
                expect(validator("1", "array[0]", { array: ["1", "2", "1", "2"] })).to.equal("Value is not unique");
                expect(validator("3", "array[0]", { array: ["1", "2", "1", "2"] })).not.to.be.ok;
            });

            it("Custom message and comparator", () => {
                const validator = unique("Custom message", (x, y) => x.id === y.id);
                expect(validator({ id: "1"}, "array[0]", { array: [{ id: "1"} , { id: "2" }] })).not.to.be.ok;
                expect(validator({ id: "1"}, "array[0]", { array: [{ id: "1"} , { id: "2" }, { id: "1"}] })).to.equal("Custom message");
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