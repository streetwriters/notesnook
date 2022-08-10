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
  openSideMenu
} = require('./utils');
const { sleep } = require('./utils');

async function lockNote() {
  await tapById(notesnook.listitem.menu);
  await tapById('icon-Vault');
  await sleep(1000);
  await visibleByText('Lock');
  await elementById(notesnook.ids.dialogs.vault.pwd).typeText('1234');
  await elementById(notesnook.ids.dialogs.vault.pwdAlt).typeText('1234');
  await tapByText('Lock');
  await sleep(500);
  await visibleById('note-locked-icon');
}

async function removeFromVault() {
  await tapById(notesnook.listitem.menu);
  await tapById('icon-Vault');
  await sleep(1000);
  await elementById(notesnook.ids.dialogs.vault.pwd).typeText('1234');
  await tapByText('Unlock');
  await sleep(1000);
  await notVisibleById('note-locked-icon');
}

async function openLockedNote(pwd) {
  await tapById(notesnook.ids.note.get(1));
  await sleep(1000);
  await visibleByText('Open');
  await elementById(notesnook.ids.dialogs.vault.pwd).typeText(pwd || '1234');
  await tapByText('Open');
  await sleep(1000);
  await matchSnapshot(elementById('editor-wrapper'), `note-after-vault-unlock`);
}

async function goToPrivacySecuritySettings() {
  await navigate('Settings');
  await tapByText('Vault');
}

describe('VAULT', () => {
  it('Create vault from settings', async () => {
    await prepare();
    await goToPrivacySecuritySettings();
    await tapByText('Create vault');
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText('1234');
    await elementById(notesnook.ids.dialogs.vault.pwdAlt).typeText('1234');
    await tapByText('Create');
    await sleep(500);
    await visibleByText('Clear vault');
  });

  it('Change vault password', async () => {
    await prepare();
    await createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await tapByText('Change vault password');
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText('1234');
    await elementById(notesnook.ids.dialogs.vault.changePwd).typeText('2362');
    await tapByText('Change');
    await device.pressBack();
    await device.pressBack();
    await openLockedNote('2362');
  });

  it('Delete vault', async () => {
    await prepare();
    await createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await tapByText('Delete vault');
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText('1234');
    await tapByText('Delete');
    await sleep(500);
    await visibleByText('Create vault');
    await device.pressBack();
    await device.pressBack();
    await visibleById(notesnook.listitem.menu);
  });

  it('Delete vault with locked notes', async () => {
    await prepare();
    await createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await tapByText('Delete vault');
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText('1234');
    await tapByText('Delete all notes');
    await tapByText('Delete');
    await sleep(500);
    await visibleByText('Create vault');
    await device.pressBack();
    await device.pressBack();
    await notVisibleById(notesnook.listitem.menu);
  });

  it('Add a note to vault', async () => {
    await prepare();
    await createNote();
    await lockNote();
    await openLockedNote();
  });

  it('Remove note from vault', async () => {
    await prepare();
    await createNote();
    await lockNote();
    await removeFromVault();
  });
});
