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
  return element(by.id(id));
}

export function elementByText(text) {
  return element(by.text(text));
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

export async function navigate(screen) {
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
  await sleep(100);
  await elementByText(screen).tap();
}
