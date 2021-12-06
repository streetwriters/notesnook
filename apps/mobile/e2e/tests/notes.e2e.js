const {notesnook} = require('../test.ids');
const {sleep} = require('./utils.test');

async function makeNote() {
  await element(by.text('Add your First Note')).tap();
  await sleep(100);
  const editor = element(by.id(notesnook.editor.id));
  await sleep(100);
  await editor.typeText('This is the text of **the note. which is working');
  await sleep(100);
  await element(by.id(notesnook.ids.default.header.buttons.back)).tap();
}

async function deleteNote() {
  await sleep(300);
  await element(by.id(notesnook.ids.note.menu)).tap();
  await sleep(100);
  const deleteBtn = element(by.id('icon-' + 'Delete'));
  await sleep(100);
  await deleteBtn.tap();
  await sleep(100);
}

it('Take a new note', async () => {
  await makeNote();
});

it('Delete a note', async () => {
  await deleteNote();
});
