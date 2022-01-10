const {beforeEach} = require('detox');
const detox = require('detox');
const {beforeAll, test, describe} = require('jest-circus');
const {notesnook} = require('../test.ids');
const {
  LaunchApp,
  navigate,
  tapById,
  elementById,
  visibleByText,
  tapByText,
  elementByText,
  createNote,
  prepare
} = require('./misc.e2e');

describe('Basic tests', () => {
  it('App should launch successfully & hide welcome screen', async () => {
    await LaunchApp();
  });

  it('Basic navigation should work', async () => {
    await prepare();
    await navigate('Notebooks');
    await navigate('Favorites');
    await navigate('Trash');
    await navigate('Tags');
    await navigate('Settings');
    await navigate('Monographs');
    await navigate('Notes');
  });

  it('Create a note in editor', async () => {
    await prepare();
    await createNote();
  });

  it('Open and close a note', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.ids.note.get(1));
    await tapById(notesnook.editor.back);
  });

  it('Export note dialog should show', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Export');
    await visibleByText('PDF');
  });

  it('Delete & restore a note', async () => {
    await LaunchApp();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Delete');
    await tapById(notesnook.toast.button);
    await visibleByText(
      'Test note description that is very long and should not fit in text.'
    );
  });
});
