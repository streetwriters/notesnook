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

async function sortBy(sorting, elementText = 'Default') {
  await tapByText(elementText);
  await tapByText(sorting);
  await device.pressBack();
}

describe('Sort & filter', () => {
  it('Sort by date-edited/date-created', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    let note2 = await createNote('Note 2', 'Note 2');
    await sleep(300);
    await tapByText('Note 1');
    await sleep(500);
    await elementById(notesnook.editor.id).tap({
      x: 40,
      y: 100
    });
    await elementById(notesnook.editor.id).typeText(' hello');
    await tapById(notesnook.editor.back);
    await sleep(500);
    await sortBy('Date created');
    await tapById(notesnook.listitem.menu);
    await visibleByText('Note 2');
    await device.pressBack();
    await sortBy('Date edited');
    await tapById(notesnook.listitem.menu);
    await visibleByText('Note 1 hello');
    await device.pressBack();
  });

  it('Disable grouping', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    await sleep(300);
    await sortBy('None');
    await sleep(300);
    await visibleByText('None');
  });

  it('Group by Abc', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    await sleep(300);
    await sortBy('Abc');
    await visibleByText('N');
  });

  it('Group by Year', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    await sleep(300);
    await sortBy('Year');
    await sleep(300);
    await visibleByText('Year');
  });

  it('Group by Week', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    await sleep(300);
    await sortBy('Week');
    await sleep(300);
    await visibleByText('Week');
  });

  it('Group by Month', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    await sleep(300);
    await sortBy('Month');
    await sleep(300);
    await visibleByText('Month');
  });

  it('Compact mode', async () => {
    await prepare();
    let note1 = await createNote('Note 1', 'Note 1');
    await sleep(300);
    await tapById('icon-compact-mode');
    await sleep(300);
    await notVisibleByText('Note 1');
    await tapById('icon-compact-mode');
    await sleep(300);
    await visibleByText('Note 1');
  });
});
