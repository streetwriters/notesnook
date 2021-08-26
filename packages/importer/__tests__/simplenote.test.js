const simplenote = require("../providers/simplenote");
const utils = require("./utils");

test("convert simplenote backup zip file", () => {
  let file = utils.getFile("simplenote.zip");

  expect(simplenote.convert([file])).toMatchSnapshot("simplenote-backup");
});