import { expect } from "chai";
import { required, match, min, max, unique, validate } from "./validator";

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

            it("Null with message function", () => {
                const customValidator = required(key => key);
                expect(customValidator(null)).to.equal("required");
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

            it("Undefined", () => {
                expect(match()()).not.to.be.ok;
            });

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

            it("Fail with message function", () => {
                const validator = match(/w+/, key => key);
                expect(validator("-+*")).to.equal("match");
            });

        });

        describe("Min", () => {

            it("Undefined", () => {
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
                const now = new Date();
                const date = new Date();
                date.setDate(date.getDate() + 1000);
                expect(min(now)(date)).not.to.be.ok;
            });

            it("Invalid", () => {
                const validator = min(5);
                const error = "Should be at least 5";
                expect(validator(2)).to.equal(error);
                expect(validator(2.45)).to.equal(error);
                expect(validator([1, 2])).to.equal(error);
                expect(validator("ab")).to.equal(error);
                expect(validator("12")).to.equal(error);
                const now = new Date();
                const date = new Date();
                date.setDate(date.getDate() - 1000);
                expect(min(now)(date)).to.equal("Should be at least " + now);
            });

            it("Custom message", () => {
                const error = "Custom";
                const validator = min(5, error);
                expect(validator(2)).to.equal(error);
                expect(validator(2.45)).to.equal(error);
                expect(validator([1, 2])).to.equal(error);
                expect(validator("ab")).to.equal(error);
            });

            it("Message function", () => {
                const validator = min(5, key => key);
                expect(validator(2)).to.equal("min");
            });

        });

        describe("Max", () => {

            it("Undefined", () => {
                expect(max()()).not.to.be.ok;
            });

            it("Valid", () => {
                const validator = max(5);
                expect(validator(2)).not.to.be.ok;
                expect(validator(2.45)).not.to.be.ok;
                expect(validator([1, 2])).not.to.be.ok;
                expect(validator("ab")).not.to.be.ok;
                expect(validator("12")).not.to.be.ok;
                const now = new Date();
                const date = new Date();
                date.setDate(date.getDate() - 1000);
                expect(max(now)(date)).not.to.be.ok;
            });

            it("Invalid", () => {
                const error = "Should be not more than 5";
                const validator = max(5);
                expect(validator(8)).to.equal(error);
                expect(validator(8.45)).to.equal(error);
                expect(validator([1, 2, 3, 4, 5, 6])).to.equal(error);
                expect(validator("abcdefghi")).to.equal(error);
                expect(validator("123456789")).to.equal(error);
                const now = new Date();
                const date = new Date();
                date.setDate(date.getDate() + 1000);
                expect(max(now)(date)).to.equal("Should be not more than " + now);
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

            it("Message function", () => {
                const validator = max(5, key => key);
                expect(validator(6)).to.equal("max");
            });

        });

        describe("Unique", () => {

            it("Undefined", () => {
                expect(unique()()).not.to.be.ok;
            });

            it("Valid", () => {
                const validator = unique();
                const array = ["1", "2"];
                expect(validator(array, "array")).not.to.be.ok;
            });

            it("Invalid", () => {
                const validator = unique();
                const array = ["1", "2", "1"];
                expect(validator(array, "array")).to.deep.equal({
                    "array[0]": "Value is not unique",
                    "array[2]": "Value is not unique"
                });
            });

            it("Custom message and comparator", () => {
                const validator = unique((x, y) => x.id === y.id, "Custom message");
                const validArray = [{ id: "1"} , { id: "2" }];
                const invalidArray = [{ id: "1"} , { id: "2" }, { id: "1"}];
                expect(validator(validArray, "array")).not.to.be.ok;
                expect(validator(invalidArray, "array")).to.deep.equal({
                    "array[0]": "Custom message",
                    "array[2]": "Custom message",
                });
            });

            it("Tree", () => {
                const validator = unique((x, y) => x.code === y.code, null, "children");
                const tree = [
                    { id: "1", code: "8", children: [
                        { id: "2", code: "1" }
                    ] },
                    { id: "3", code: "2", children: [
                        { id: "4", code: "1", children: [
                            {id: "5", code: "1"}
                        ] }
                    ] },
                    { id: "6", code: "5" }
                ];
                expect(validator(tree, "tree")).to.deep.equal({
                    "tree[0].children[0]": "Value is not unique",
                    "tree[1].children[0]": "Value is not unique",
                    "tree[1].children[0].children[0]": "Value is not unique",
                });
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

        it("Custom array validator", () => {
            const object = { array: [{ id: "1" }, { id: "2" }] };
            const validationResult = { "array[0].id": "Wrong", "array[1].id": "Wrong" };
            const schema = { array: (value, path, allValues) => validationResult };
            expect(validate(object, schema)).to.deep.equal(validationResult);
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
            expect(await validate(object, schema)).to.deep.equal({ "field": "Invalid" });
        });

        it("Async root validate", async () => {
            const error = "Username is not unique";
            const object = { username: "user" };
            const schema = { _root: async value => ({ username: error }) };
            expect(await validate(object, schema)).to.deep.equal({ "username": error });
        });

        it("Sync and async", async () => {
            const object = { fieldOne: "value", fieldTwo: 4 };
            let schema = { fieldOne: async () => "Invalid", fieldTwo: () => "No" };
            expect(await validate(object, schema)).to.deep.equal({ "fieldOne": "Invalid", "fieldTwo": "No" });

            schema = { fieldOne: () => "No", fieldTwo: async () => "Invalid" };
            expect(await validate(object, schema)).to.deep.equal({ "fieldOne": "No", "fieldTwo": "Invalid" });
        });

    });

});