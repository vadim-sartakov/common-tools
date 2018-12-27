import { expect } from "chai";
import { required, match, min, max, uniqueArray, uniqueObject, validate, validateAsync } from "./validator";

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
                const validator = uniqueArray();
                expect(validator("1", "array[0]", { array: ["1", "2"] })).not.to.be.ok;
            });

            it("Invalid", () => {
                const validator = uniqueArray();
                expect(validator("1", "array[0]", { array: ["1", "2", "1", "2"] })).to.equal("Value is not unique");
                expect(validator("2", "array[0]", { array: ["1", "2", "1", "2"] })).to.equal("Value is not unique");
            });

            it("Mixed", () => {
                const validator = uniqueArray();
                expect(validator("1", "array[0]", { array: ["1", "2", "1", "2"] })).to.equal("Value is not unique");
                expect(validator("3", "array[0]", { array: ["1", "2", "1", "2"] })).not.to.be.ok;
            });

            it("Custom message and comparator", () => {
                const validator = uniqueArray((x, y) => x.id === y.id, "Custom message");
                expect(validator({ id: "1"}, "array[0]", { array: [{ id: "1"} , { id: "2" }] })).not.to.be.ok;
                expect(validator({ id: "1"}, "array[0]", { array: [{ id: "1"} , { id: "2" }, { id: "1"}] })).to.equal("Custom message");
            });

        });

    });

    describe("Validate", () => {

        it("Valid flat object", () => {
            const object = { firstName: "Bill", lastName: "Gates" };
            const schema = { firstName: required(), lastName: required() };
            expect(validate(object, schema)).not.to.be.ok;
        });

        it("Invalid flat object", () => {
            const object = { };
            const schema = { firstName: required(), lastName: required() };
            expect(validate(object, schema)).to.deep.equal({
                "firstName": "Value is required",
                "lastName": "Value is required",
            });
        });

        it("Invalid nested object", () => {
            const object = { };
            const schema = { field: { nested: required() } };
            expect(validate(object, schema)).to.deep.equal({ "field.nested": "Value is required" });
        });

        it("Invalid custom validators", () => {
            const object = { firstName: "", lastName: "Gates" };
            const schema = { firstName: required(), lastName: (value, path, allValues) => "Invalid" };
            expect(validate(object, schema)).to.deep.equal({
                "firstName": "Value is required",
                "lastName": "Invalid",
            });
        });

        it("Valid array", () => {
            const object = { array: [{ id: "1" }, { id: "2" }] };
            const schema = { array: { id: required() } };
            expect(validate(object, schema)).not.to.be.ok;
        });

        it("Invalid array", () => {
            const object = { array: [{ id: "1" }, { id: "2" }] };
            const schema = { array: { field: required() } };
            expect(validate(object, schema)).to.deep.equal({
                "array[0].field": "Value is required",
                "array[1].field": "Value is required",
            });
        });

        it("Invalid string array", () => {
            const object = { array: ["1", "2", "3", "1"] };
            const schema = { array: uniqueArray() };
            expect(validate(object, schema)).to.deep.equal({
                "array[0]": "Value is not unique",
                "array[3]": "Value is not unique",
            });
        });

        it("Invalid object array", () => {
            const object = { array: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "1" }] };
            const schema = { array: uniqueArray(undefined, (x, y) => x.id === y.id) };
            expect(validate(object, schema)).to.deep.equal({
                "array[0]": "Value is not unique",
                "array[3]": "Value is not unique",
            });
        });

        it("Root validation", () => {
            const error = "Passwords should be equal";
            const object = { password: "pwd", repeatPassword: "pw" };
            const schema = { _root: value => {
                return value.password === value.repeatPassword ? undefined : { "password": error, "repeatPassword": error };
            }};
            expect(validate(object, schema)).to.deep.equal({ "password": error, "repeatPassword": error });
            object.repeatPassword = "pwd";
            expect(validate(object, schema)).not.to.be.ok;
        });

        it("Async validate", async () => {
            const object = { field: "value" };
            const schema = { field: async () => "Invalid" };
            expect(await validate(object, schema)).to.equal("Invalid");
        });

        it("Async root validate", async () => {
            const error = "Username is not unique";
            const object = { username: "user" };
            const schema = { _root: async value => ({ username: error }) };
            expect(await validate(object, schema)).to.equal({ username: error });
        });

    });

});