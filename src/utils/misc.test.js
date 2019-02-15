import { expect } from "chai";
import { filterObject, projectionMeta } from "./misc";

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

    const object = {
      array: [
        { id: 0, first: "1", second: "1" },
        { id: 1, first: "2", second: "2" },
        { id: 2, first: "3", second: "3" },
      ]
    };

    it("Exclusive fields and merge with nothing", () => {
      const result = filterObject(object, { "array.first": 0 });
      expect(result).to.deep.equal({
        array: [
          { id: 0, second: "1" },
          { id: 1, second: "2" },
          { id: 2, second: "3" },
        ]
      });
    });

    it("Inclusive fields and merge with nothing", () => {
      const result = filterObject(object, { "array.first": 1 });
      expect(result).to.deep.equal({
        array: [
          { first: "1" },
          { first: "2" },
          { first: "3" },
        ]
      });
    });

    it("Exclusive fields and merge with same row ids", () => {
      const result = filterObject(object, { "array.first": 0 }, {
        array: [
          { id: 0, first: "111", second: "1" },
          { id: 1, first: "2", second: "2" },
          { id: 2, first: "3", second: "333" },
        ]
      });
      expect(result).to.deep.equal({
        array: [
          { id: 0, first: "111", second: "1" },
          { id: 1, first: "2", second: "2" },
          { id: 2, first: "3", second: "3" },
        ]
      });
    });

    it("Inclusive fields and merge with same row ids", () => {
      const result = filterObject(object, { "array.first": 1 }, {
        array: [
          { id: 0, first: "111", second: "1" },
          { id: 1, first: "2", second: "2" },
          { id: 2, first: "3", second: "333" },
        ]
      });
      expect(result).to.deep.equal({
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 1, first: "2", second: "2" },
          { id: 2, first: "3", second: "333" },
        ]
      });
    });

    it("Exclusive fields and merge with additional and reordered rows", () => {
      const objectToFilter = {
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 2, first: "333", second: "333" },
          { id: 1, first: "2", second: "2" },
          { id: 3, first: "4", second: "4" }
        ]
      };
      const result = filterObject(objectToFilter, { "array.first": 0 }, {
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 1, first: "2", second: "2" },
          { id: 2, first: "3", second: "3" },
        ]
      });
      expect(result).to.deep.equal({
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 2, first: "3", second: "333" },
          { id: 1, first: "2", second: "2" },
          { id: 3, second: "4" }
        ]
      });
    });

    it("Inclusive fields and merge with deleted and reordered rows", () => {
      const objectToFilter = {
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 2, first: "333", second: "333" },
        ]
      };
      const result = filterObject(objectToFilter, { "array.first": 1 }, {
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 1, first: "2", second: "2" },
          { id: 2, first: "3", second: "3" },
        ]
      });
      expect(result).to.deep.equal({
        array: [
          { id: 0, first: "1", second: "1" },
          { id: 2, first: "333", second: "3" }
        ]
      });
    });

  });

});

describe('Get projection meta', () => {

  describe('String', () => {

    it('Inclusive', () => {
      expect(projectionMeta("id name")).to.deep.equal({
        isExclusive: false,
        projection: { id: 1, name: 1 }
      });
    });

    it('Exclusive', () => {
      expect(projectionMeta("-id -name")).to.deep.equal({
        isExclusive: true,
        projection: { id: 0, name: 0 }
      });
    });

    it('Mixing types', () => {
      expect(() => projectionMeta("-id name")).to.deep.throw('It\'s not allowed to mix inclusive and exclusive paths in projection');
    });

  });

  describe('Object', () => {
    it('Inclusive', () => {
      expect(projectionMeta({ id: 1, name: 1 })).to.deep.equal({
        isExclusive: false,
        projection: { id: 1, name: 1 }
      });
    });

    it('Exclusive', () => {
      expect(projectionMeta({ id: 0, name: 0 })).to.deep.equal({
        isExclusive: true,
        projection: { id: 0, name: 0 }
      });
    });

    it('Mixing types', () => {
      expect(() => projectionMeta({ id: 1, name: 0 })).to.deep.throw('It\'s not allowed to mix inclusive and exclusive paths in projection');
    });
  });

  it('Wrong type', () => {
    expect(() => projectionMeta(4)).to.throw('Projection must be either string or object');
  });

});