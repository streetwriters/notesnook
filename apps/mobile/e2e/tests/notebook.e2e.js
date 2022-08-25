const detox = require('detox');
const { notesnook } = require('../test.ids');
const {
  tapById,
  elementById,
  visibleByText,
  tapByText,
  createNote,
  prepare,
  visibleById,
  expectBitmapsToBeEqual,
  matchSnapshot,
  notVisibleById,
  navigate,
  elementByText
} = require('./utils');
const { sleep } = require('./utils');

async function createNotebook(title = 'Notebook 1', description = true, topic = true) {
  await tapByText('Add your first notebook');
  await elementById(notesnook.ids.dialogs.notebook.inputs.title).typeText(title);
  if (description) {
    await elementById(notesnook.ids.dialogs.notebook.inputs.description).typeText(
      `Description of ${title}`
    );
  }
  if (topic) {
    await elementById(notesnook.ids.dialogs.notebook.inputs.topic).typeText('Topic');
    await tapById('topic-add-button');
  }
  await tapByText('Create notebook');
  await sleep(500);
}

async function addTopic(title = 'Topic') {
  await tapById(notesnook.buttons.add);
  await elementById('input-title').typeText(title);
  await tapByText('Add');
  await sleep(500);
}

describe('NOTEBOOKS', () => {
  it('Create a notebook with title only', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText('Notebook 1');
  });

  it('Create a notebook title & description', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText('Notebook 1');
  });

  it('Create a notebook with description and topics', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText('Notebook 1');
  });

  it('Create a notebook, add topic, move notes', async () => {
    await prepare();
    let note = await createNote();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, true);
    await sleep(500);
    await tapByText('Topic');
    await sleep(500);
    await tapById('listitem.select');
    await tapByText('Move selected notes');
    await sleep(500);
    await tapByText('Topic');
    await sleep(500);
    await visibleByText(note.body);
  });

  it('Add new topic to notebook', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText('Notebook 1');
    await tapById(notesnook.buttons.add);
    await elementById('input-title').typeText('Topic');
    await tapByText('Add');
    await sleep(500);
    await visibleByText('Topic');
  });

  it('Edit topic', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText('Notebook 1');
    await sleep(300);
    await visibleByText('Topic');
    await tapById(notesnook.ids.notebook.menu);
    await tapByText('Edit topic');
    await elementById('input-title').typeText(' (edited)');
    await tapByText('Save');
    await visibleByText('Topic (edited)');
  });

  it('Add new note to topic', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText('Topic');
    await createNote();
  });

  it('Remove note from topic', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText('Topic');
    let note = await createNote();
    await elementByText(note.body).longPress();
    await tapByText('Select');
    await tapById('select-minus');
    await notVisibleById(note.title);
  });

  it('Add/Remove note to notebook from home', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await navigate('Notes');
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Add to notebook');
    await sleep(500);
    await tapByText('Notebook 1');
    await tapByText('Topic');
    await visibleById('icon-check');
    await tapByText('Topic');
    await notVisibleById('icon-check');
  });

  it('Edit notebook title, description and add a topic', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook();
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText('Notebook 1');
    await tapById(notesnook.ids.notebook.menu);
    await tapByText('Edit notebook');
    await sleep(500);
    await elementById(notesnook.ids.dialogs.notebook.inputs.title).typeText(' (Edited)');
    await elementById(notesnook.ids.dialogs.notebook.inputs.description).clearText();
    await elementById(notesnook.ids.dialogs.notebook.inputs.description).typeText(
      'Description of Notebook 1 (Edited)'
    );
    await elementById(notesnook.ids.dialogs.notebook.inputs.topic).typeText('Topic 2');
    await tapById('topic-add-button');
    await tapByText('Save changes');
    await sleep(500);
    await visibleByText('Notebook 1 (Edited)');
    await visibleByText('Description of Notebook 1 (Edited)');
    await visibleByText('Topic 2');
  });

  it('Move notebook to trash', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText('Notebook 1');
    await tapById(notesnook.ids.notebook.menu);
    await tapByText('Move to trash');
    await sleep(4000);
    await navigate('Trash');
    await visibleByText('Notebook 1');
  });

  it('Pin notebook to side menu', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText('Notebook 1');
    await tapById(notesnook.ids.notebook.menu);
    await tapByText('Add Shortcut');
    let menu = elementById(notesnook.ids.default.header.buttons.left);
    await menu.tap();
    await visibleByText('Notebook 1');
  });

  it.only('Pin topic to side menu', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1');
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText('Notebook 1');
    await tapById(notesnook.ids.notebook.menu);
    await tapByText('Add Shortcut');
    let menu = elementById(notesnook.ids.default.header.buttons.left);
    await menu.tap();
    await menu.tap();
    await visibleByText('Topic');
  });
});
