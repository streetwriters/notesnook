import { areAllEmpty } from "../utils";

test("return true if all array items in object are empty", () => {
  const result = areAllEmpty({ a: [], b: [], c: true, f: 214 });
  expect(result).toBe(true);
});

test("return false if any array item in object is not empty", () => {
  const result = areAllEmpty({ a: [2, 3, 4], b: [], c: true, f: 214 });
  expect(result).toBe(false);
});
