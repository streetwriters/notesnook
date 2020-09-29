const sleep = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));

let menu;

it('CHECK APP LOADED', async () => {
  await expect(element(by.id('mobile_main_view'))).toBeVisible();
});

it('CHECK MENU NAVIGATION', async () => {
  menu = element(by.id('left_menu_button'));
  menu.tap();
  await sleep(200);
  element(by.id('Notebooks')).tap();
  menu.tap();
  await sleep(200);
  element(by.id('Favorites')).tap();
  menu.tap();
  await sleep(200);
  element(by.id('Trash')).tap();
  menu.tap();
  await sleep(200);
  element(by.text('Tags')).tap();
  menu.tap();
  await sleep(200);
  element(by.id('Settings')).tap();
  menu.tap();
  await sleep(200);

});

it('CHECK NIGHT MODE SWITCHING', async () => {
  element(by.id('night_mode')).tap();
  await sleep(2000);
  element(by.id('night_mode')).tap();

});







/* it('Check if editor can be opened and edited', async () => {
  await expect(element(by.id('container_bottom_btn'))).toBeVisible();
  await sleep(200);
  await element(by.id('container_bottom_btn')).tap();
  await sleep(1000);

  const editor = element(by.id('editor'));
  await expect(editor).toBeVisible();
  await editor.tap();
  await sleep(200);
  await editor.typeText('hello world, this an automated note creation');
});
 */