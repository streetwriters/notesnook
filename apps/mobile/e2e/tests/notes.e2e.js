const { notesnook } = require("../test.ids");
const { sleep } = require("./utils.test");


it('Take a new note', async () => {
	await element(by.text('Add your First Note')).tap();
	await sleep(100)
	const editor = element(by.id(notesnook.ids.default.editor));
	await sleep(100)
	await editor.typeText('This is the text of **the note. which is working');
	await sleep(100)
	await element(by.id(notesnook.ids.default.header.buttons.back)).tap();
  }); 