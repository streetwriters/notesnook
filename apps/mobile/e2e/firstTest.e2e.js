const {sleep} = require('./utils');

it('Check if app is loaded', async () => {
  await expect(element(by.id('mobile_main_view'))).toBeVisible();
});

it('Check if editor can be opened', async () => {
  await expect(element(by.id('container_bottom_btn_text'))).toBeVisible();
  await element(by.id('container_bottom_btn')).tap();
  await sleep(2000);
  await expect(element(by.id('editor'))).toBeVisible();
});
