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
  prepare,
  visibleById
} = require('./misc.e2e');

describe('Basic tests', () => {
  it('Favorite and unfavorite a note', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Favorite');
    await visibleById('icon-star');
    await navigate('Favorites');
    await visibleByText(note.body);
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Favorite');
    await expect(element(by.text(note.body))).not.toBeVisible();
    await navigate('Notes');
  });

  it('Pin and upin a note', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Pin');
    await visibleByText('Pinned');
    await visibleById('icon-pinned');
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Pin');
    expect(element(by.id('icon-pinned'))).not.toBeVisible();
  });

  it('App should launch successfully & hide welcome screen', async () => {
    await prepare();
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
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Delete');
    await tapById(notesnook.toast.button);
    await visibleByText(
      'Test note description that is very long and should not fit in text.'
    );
  });
});
