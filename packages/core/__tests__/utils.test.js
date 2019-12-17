import { groupBy } from "../utils";

test("groupBy should work", () => {
  let ret = groupBy([1, 2, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3], x => x.toString());
  expect(ret.length).toBe(3);
  expect(ret[0].title).toBe("1");
  expect(ret[1].title).toBe("2");
  expect(ret[2].title).toBe("3");
});
