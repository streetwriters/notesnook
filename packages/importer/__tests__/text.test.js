const text = require("../providers/plaintext");

test("convert evernote note enex file", () => {
  let file = {
	  data:"Hello world",
	  fileName:"world.txt",
	  createdAt:0,
	  modifiedAt:0
  }

  expect(text.convert([file])).toMatchSnapshot("text-file");
});