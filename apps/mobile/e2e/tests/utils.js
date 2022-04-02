const { notesnook } = require('../test.ids');
const fs = require('fs');

export const sleep = duration =>
  new Promise(resolve =>
    setTimeout(() => {
      console.log('Sleeping for ' + duration / 1000 + ' secs');
      resolve();
    }, duration)
  );

export async function LaunchApp() {
  await expect(element(by.id(notesnook.ids.default.root))).toBeVisible();
  await expect(element(by.id('notesnook.splashscreen'))).toBeVisible();
  await element(by.text('Get started')).tap();
  await sleep(500);
  await element(by.text('Next')).tap();

  await sleep(500);
  await element(by.text('Create your account')).tap();
  await sleep(500);
  await element(by.text('Skip for now')).tap();
  await sleep(300);
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

export async function notVisibleById(id) {
  await expect(elementById(id)).not.toBeVisible();
}

export async function notVisibleByText(text) {
  await expect(elementByText(text)).not.toBeVisible();
}

export async function createNote() {
  let title = 'Test note description that ';
  let body = 'Test note description that is very long and should not fit in text.';

  await tapById(notesnook.buttons.add);
  await elementById(notesnook.editor.id).tap({
    x: 15,
    y: 15
  });
  await elementById(notesnook.editor.id).typeText(body);
  await tapById(notesnook.editor.back);
  await sleep(500);
  await expect(element(by.text(body))).toBeVisible();

  return { title, body };
}

export async function openSideMenu() {
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
  await sleep(100);
}

export async function navigate(screen) {
  await sleep(500);
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
  await sleep(100);
  await elementByText(screen).tap();
}

const testvars = {
  isFirstTest: true
};

export async function prepare() {
  if (testvars.isFirstTest) {
    console.log('Launching App Directly without reset');
    testvars.isFirstTest = false;
    return await LaunchApp();
  }
  await device.reverseTcpPort(8081);
  await device.uninstallApp();
  await device.installApp();
  await device.launchApp({ newInstance: true });
  await LaunchApp();
}

const jestExpect = require('expect');
const { toMatchImageSnapshot } = require('jest-image-snapshot');
jestExpect.extend({ toMatchImageSnapshot });

export async function matchSnapshot(element, name) {
  let path = await element.takeScreenshot(name);
  const bitmapBuffer = fs.readFileSync(path);
  jestExpect(bitmapBuffer).toMatchImageSnapshot();
}
