import { expect } from "chai";
import { filterObject } from "./misc";

describe("Object filter", () => {

    describe("Flat", () => {

        const object = { first: "1", second: "2", third: "3" };

        it("Exclusive fields and merge with nothing", () => {
            const result = filterObject(object, { first: 0 });
            expect(result).to.deep.equal({ second: "2", third: "3" });
        });

        it("Inclusive fields and merge with nothing", () => {
            const result = filterObject(object, { first: 1 });
            expect(result).to.deep.equal({ first: "1" });
        });

        it("Exclusive fields and merge specified", () => {
            const result = filterObject(object, { first: 0 }, { first: "111" });
            expect(result).to.deep.equal({ first: "111", second: "2", third: "3" });
        });

    });

    describe("Nested", () => {

        const object = { nested: { first: "1", second: "2", third: "3" } };

        it("Exclusive fields and merge with nothing", () => {
            const result = filterObject(object, { "nested.first": 0 });
            expect(result).to.deep.equal({ nested: { second: "2", third: "3" } });
        });

        it("Inclusive fields and merge with nothing", () => {
            const result = filterObject(object, { "nested.first": 1 });
            expect(result).to.deep.equal({ nested: { first: "1" } });
        });

        it("Exclusive fields and merge specified", () => {
            const result = filterObject(object, { "nested.first": 0 }, { nested: { first: "111" } });
            expect(result).to.deep.equal({ nested: { first: "111", second: "2", third: "3" } });
        });

    });

    describe("Arrays", () => {

        const object = { array: [
            { id: 0, first: "1", second: "1" },
            { id: 1, first: "2", second: "2" },
            { id: 2, first: "3", second: "3" },
        ]};

        it("Exclusive fields and merge with nothing", () => {
            const result = filterObject(object, { "array.first": 0 });
            expect(result).to.deep.equal({ array: [
                { id: 0, second: "1" },
                { id: 1, second: "2" },
                { id: 2, second: "3" },
            ]});
        });

        it("Inclusive fields and merge with nothing", () => {
            const result = filterObject(object, { "array.first": 1 });
            expect(result).to.deep.equal({ array: [
                { first: "1" },
                { first: "2" },
                { first: "3" },
            ]});
        });

        it("Exclusive fields and merge with same row ids", () => {
            const result = filterObject(object, { "array.first": 0 }, { array: [
                { id: 0, first: "111", second: "1" },
                { id: 1, first: "2", second: "2" },
                { id: 2, first: "3", second: "333" },
            ]});
            expect(result).to.deep.equal({ array: [
                { id: 0, first: "111", second: "1" },
                { id: 1, first: "2", second: "2" },
                { id: 2, first: "3", second: "3" },
            ]});
        });

        it("Inclusive fields and merge with same row ids", () => {
            const result = filterObject(object, { "array.first": 1 }, { array: [
                { id: 0, first: "111", second: "1" },
                { id: 1, first: "2", second: "2" },
                { id: 2, first: "3", second: "333" },
            ]});
            expect(result).to.deep.equal({ array: [
                { id: 0, first: "1", second: "1" },
                { id: 1, first: "2", second: "2" },
                { id: 2, first: "3", second: "333" },
            ]});
        });

    });

});