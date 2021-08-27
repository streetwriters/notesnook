const keep = require("../providers/keep");
const utils = require("./utils");

test("convert google keep backup", () => {
  let file = utils.getFile("takeout.zip");

  expect(keep.convert([file])).toMatchSnapshot("keep-backup");
});