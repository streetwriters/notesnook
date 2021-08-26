const markdown = require("../providers/markdown");

test("convert evernote note enex file", () => {
  let file = {
	  data:`# Hello world
	  This is a note`,
	  fileName:"world.md",
	  createdAt:0,
	  modifiedAt:0
  }

  expect(markdown.convert([file])).toMatchSnapshot("markdown-file");
});