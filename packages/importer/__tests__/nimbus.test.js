const nimbusnote = require("../providers/nimbusnote");
const utils = require("./utils");

test("convert simplenote backup zip file", () => {
  let file = utils.getFile("export-2021-08-27_10-11-56.zip");
  expect(nimbusnote.convert([file])).toMatchSnapshot("nimbus-export");
});
