import { groupArray } from "../utils/grouping";

test("group alphabetically", () => {
  const sortedAlphabet = "abcdefghijlmnopqrstuvwxyz"
    .split("")
    .map((a) => ({ title: a }));
  const alphabet = "nopqrstuvwxyzabcdefghijlm"
    .split("")
    .map((a) => ({ title: a, item: true }));
  let ret = groupArray(alphabet, {
    groupBy: "abc",
    sortDirection: "asc",
    sortBy: "title",
  }).filter((v) => !v.item);
  expect(
    sortedAlphabet.every((alpha, index) => {
      return ret[index].title === alpha.title.toUpperCase();
    })
  ).toBeTruthy();
});
