const {notesnook} = require('../test.ids');
const {sleep} = require('./utils.test');

export async function LaunchApp() {
  device.launchApp();
  await sleep(5000);
  await expect(element(by.id(notesnook.ids.default.root))).toBeVisible();
}
/* 
it('Drawer Navigation', async () => {
  let menu = element(by.id(notesnook.ids.default.header.buttons.left));
  await menu.tap();
  await sleep(100);
  await element(by.text('Notebooks')).tap();
  menu.tap();
  await sleep(100);
  await element(by.text('Favorites')).tap();
  menu.tap();
  await sleep(100);
  await element(by.text('Trash')).tap();
  menu.tap();
  await sleep(100);
  await element(by.text('Tags')).tap();
  menu.tap();
  await sleep(100);
  await element(by.text('Settings')).tap();
});

it('Dark Mode', async () => {
  let menu = element(by.id(notesnook.ids.default.header.buttons.left));
  menu.tap();
  await sleep(100);
  let nightmode = element(by.id(notesnook.ids.menu.nightmode));
  await sleep(100);
  await nightmode.tap();
  await sleep(100);
  await nightmode.tap();
  await sleep(100);
  menu.tap();
});
 */