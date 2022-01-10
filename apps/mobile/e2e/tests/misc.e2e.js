const {notesnook} = require('../test.ids');
const {sleep} = require('./utils.test');

export async function LaunchApp() {
  await expect(element(by.id(notesnook.ids.default.root))).toBeVisible();
  await expect(element(by.id('notesnook.splashscreen'))).toBeVisible();
  await element(by.text('Next')).tap();
  await element(by.text('Next')).tap();
  await element(by.text('Next')).tap();
  await element(by.text('Next')).tap();
  await element(by.text('Next')).tap();
  await element(by.text('Next')).tap();
  await element(by.text('I want to try the app first')).tap();
}

export function elementById(id) {
  return element(by.id(id)).atIndex(0);
}

export function elementByText(text) {
  return element(by.text(text)).atIndex(0);
}

export async function tapById(id) {
  await elementById(id).tap();
}

export async function tapByText(text) {
  await elementByText(text).tap();
}

export async function visibleByText(text) {
  await expect(elementByText(text)).toBeVisible();
}

export async function visibleById(id) {
  await expect(elementById(id)).toBeVisible();
}

export async function createNote() {
  let title = 'Test note description that ';
  let body =
    'Test note description that is very long and should not fit in text.';

  await tapById(notesnook.buttons.add);
  await elementById(notesnook.editor.id).tap({
    x: 15,
    y: 15
  });
  await elementById(notesnook.editor.id).typeText(body);
  await tapById(notesnook.editor.back);
  await sleep(500);
  await expect(element(by.text(body))).toBeVisible();

  return {title,body};
}

export async function navigate(screen) {
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
  await sleep(100);
  await elementByText(screen).tap();
}

const testvars = {
  isFirstTest:true
}

export async function prepare() {
  if (testvars.isFirstTest) {
    console.log("Launching App Directly without reset");
    testvars.isFirstTest = false;
    return await LaunchApp();
  }
  await device.reverseTcpPort(8081);
  await device.uninstallApp();
  await device.installApp();
  await device.launchApp({newInstance: true});
  await LaunchApp();
}
