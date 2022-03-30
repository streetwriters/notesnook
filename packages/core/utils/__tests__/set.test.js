import Set from "../set";

test("union", () => {
  expect(Set.union([1, 2, 2], [2, 3])).toStrictEqual([1, 2, 3]);
});

test("intersection", () => {
  expect(Set.intersection([1, 1, 2], [2, 2, 3])).toStrictEqual([2]);
});

test("difference", () => {
  expect(Set.difference([1, 1, 2], [2, 3, 3])).toStrictEqual([1, 3]);
});

test("complement", () => {
  expect(Set.complement([2, 2, 4], [2, 2, 3])).toStrictEqual([4]);
});

test("equals", () => {
  expect(Set.equals([1, 1, 2], [1, 1, 2])).toBe(true);
});

test("not equals", () => {
  expect(Set.equals([1, 1, 2], [1, 5, 2])).toBe(false);
});
