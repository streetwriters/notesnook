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
    await elementById('sheet-backdrop').tap();
    await sleep(500);
    await visibleByText('Notebook 1');
  });

  it('Create a notebook title & description', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', true, false);
    await elementById('sheet-backdrop').tap();
    await sleep(500);
    await visibleByText('Notebook 1');
  });

  it('Create a notebook with description and topics', async () => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await createNotebook('Notebook 1', false, false);
    await elementById('sheet-backdrop').tap();
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
    await elementById('sheet-backdrop').tap();
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
    await elementById('sheet-backdrop').tap();
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
    await elementById('sheet-backdrop').tap();
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
    await elementById('sheet-backdrop').tap();
    await sleep(500);
    await tapByText('Topic');
    let note = await createNote();
    await elementByText(note.body).longPress();
    await tapByText('Select');
    await tapById('select-minus');
    await notVisibleById(note.title);
  });

  //todo
  // add note to notebook from home
  // remove note from a notebook from add-notebook sheet
  // edit notebook title
  // edit notebook description
  // add a topic from edit-notebook sheet
  //
});
