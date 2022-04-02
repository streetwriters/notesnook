const { notesnook } = require('../test.ids');
const {
  navigate,
  tapById,
  visibleByText,
  createNote,
  prepare,
  visibleById,
  notVisibleById,
  elementById,
  tapByText,
  notVisibleByText
} = require('./utils');
const { sleep } = require('./utils');

describe('Tags', () => {
  it('Tag a note', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText('Add tags');
    await elementById('tag-input').typeText('testtag');
    await tapByText(`Add "#testtag"`);
    await visibleByText('#testtag');
    await device.pressBack();
    await device.pressBack();
    await navigate('Tags');
    await tapByText('#testtag');
    await visibleByText(note.body);
  });

  it('Untag a note', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText('Add tags');
    await elementById('tag-input').typeText('testtag');
    await tapByText(`Add "#testtag"`);
    await visibleByText('#testtag');
    await tapByText('#testtag');
    await device.pressBack();
    await device.pressBack();
    await notVisibleByText('#testtag');
    await navigate('Tags');
    await notVisibleByText('#testtag');
  });

  it('Creat shortcut of a tag', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText('Add tags');
    await elementById('tag-input').typeText('testtag');
    await tapByText(`Add "#testtag"`);
    await visibleByText('#testtag');
    await device.pressBack();
    await device.pressBack();
    await navigate('Tags');
    await tapById(notesnook.ids.tag.menu);
    await tapByText('Add Shortcut');
    let menu = elementById(notesnook.ids.default.header.buttons.left);
    await menu.tap();
    await visibleByText('#testtag');
  });

  it('Rename a tag', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText('Add tags');
    await elementById('tag-input').typeText('testtag');
    await tapByText(`Add "#testtag"`);
    await visibleByText('#testtag');
    await device.pressBack();
    await device.pressBack();
    await navigate('Tags');
    await tapById(notesnook.ids.tag.menu);
    await tapByText('Rename tag');
    await sleep(500);
    await elementById('input-value').clearText();
    await elementById('input-value').typeText('testtag_edited');
    await tapByText('Save');
    await visibleByText('#testtag_edited');
  });
});
