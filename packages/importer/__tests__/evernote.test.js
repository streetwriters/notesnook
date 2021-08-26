const evernote = require("../providers/evernote");
const utils = require("./utils");

test("convert evernote note enex file", () => {
  let file = utils.getFile("Essay Outline.enex");

  expect(evernote.convert([file])).toMatchSnapshot("evernote-note");
});

test("convert evernote notebook enex file", () => {
  let file = utils.getFile("First Notebook.enex");

  expect(evernote.convert([file])).toMatchSnapshot("evernote-notebook");
});
