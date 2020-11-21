import { groupBy } from "../utils";

test("groupBy should work", () => {
  let ret = groupBy([1, 2, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3], (x) => x.toString());
  expect(ret.length).toBe(15);
  expect(ret.some((i) => i.title === "1")).toBeTruthy();
  expect(ret.some((i) => i.title === "2")).toBeTruthy();
  expect(ret.some((i) => i.title === "3")).toBeTruthy();
});

test("group alphabetically", () => {
  const sortedAlphabet = "abcdefghijlmnopqrstuvwxyz".split("");
  const alphabet = "nopqrstuvwxyzabcdefghijlm".split("");
  let ret = groupBy(
    alphabet,
    (x) => x[0],
    (x) => x[0],
    "asc"
  ).filter((v) => v.title);
  expect(
    sortedAlphabet.every((alpha, index) => {
      return ret[index].title === alpha;
    })
  ).toBeTruthy();
});
