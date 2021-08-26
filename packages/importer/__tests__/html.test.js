const html = require("../providers/html");

test("convert evernote note enex file", () => {
  let file = {
	  data:"<p>Hello world</p>",
	  fileName:"world.html",
	  createdAt:0,
	  modifiedAt:0
  }

  expect(html.convert([file])).toMatchSnapshot("html-file");
});
