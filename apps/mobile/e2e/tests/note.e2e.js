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
  matchSnapshot,
  elementByText
} = require('./utils');
const { sleep } = require('./utils');

describe('NOTE TESTS', () => {
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

  it('Notes properties should show', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await visibleByText(note.body);
  });

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

  it('Pin a note to top', async () => {
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

  it('Pin a note in notifications', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-PinToNotif');
    await visibleByText('Unpin from Notifications');
    await sleep(500);
    await tapById('icon-PinToNotif');
    await visibleByText('Pin to Notifications');
  });

  it('Copy note', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Copy');
    await visibleByText('Note copied to clipboard');
  });

  it('Export note dialog should show', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Export');
    await visibleByText('PDF');
  });

  it('Assign colors to a note', async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById(notesnook.ids.dialogs.actionsheet.color('red'));
    await visibleById('icon-check');
    await tapById(notesnook.ids.dialogs.actionsheet.color('red'));
    await notVisibleById('icon-check');
    await tapById(notesnook.ids.dialogs.actionsheet.color('green'));
    await device.pressBack();
    await navigate('Green');
    await visibleByText(note.body);
  });

  it('Delete & restore a note', async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById('icon-Delete');
    await tapById(notesnook.toast.button);
    await visibleByText('Test note description that is very long and should not fit in text.');
  });
});
