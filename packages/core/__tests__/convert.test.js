import Convert from "../utils/convert";

test("object to string", () => {
  let objStr = Convert.toString({ hello: "world" });
  expect(objStr).toStrictEqual(`{"hello":"world"}`);
});

test("array to string", () => {
  let arrStr = Convert.toString(["hello", "world", "what"]);
  expect(arrStr).toStrictEqual(`["hello","world","what"]`);
});

test("number to string", () => {
  let numStr = Convert.toString(2010);
  expect(numStr).toBe("2010");
});

test("bool to string", () => {
  let boolStr = Convert.toString(true);
  expect(boolStr).toBe("true");
});

test("null conversion", () => {
  expect(Convert.toString(undefined)).toBeUndefined();
});

//fromString
test("string to bool", () => {
  expect(Convert.fromString("true")).toBe(true);
  expect(Convert.fromString("false")).toBe(false);
});

test("string to int", () => {
  expect(Convert.fromString("2010")).toBe(2010);
});

test("string to float", () => {
  expect(Convert.fromString("20.2")).toBe(20.2);
});

test("string to object", () => {
  let objStr = JSON.stringify({ hello: "world" });
  expect(Convert.fromString(objStr)).toStrictEqual({ hello: "world" });
});

test("string to array", () => {
  expect(Convert.fromString('["hello","world","what"]')).toStrictEqual([
    "hello",
    "world",
    "what"
  ]);
});

test("string to string", () => {
  expect(Convert.fromString("hello")).toBe("hello");
});
