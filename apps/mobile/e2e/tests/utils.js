const { notesnook } = require("../test.ids");
const fs = require("fs");
const { expect: jestExpect } = require("@jest/globals");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const detox = require("detox");
jestExpect.extend({ toMatchImageSnapshot });

const sleep = (duration) =>
  new Promise((resolve) =>
    setTimeout(() => {
      console.log("Sleeping for " + duration / 1000 + " secs");
      resolve();
    }, duration)
  );

async function LaunchApp() {
  await expect(element(by.id(notesnook.ids.default.root))).toBeVisible();
  await sleep(500);
}

function elementById(id) {
  return element(by.id(id)).atIndex(0);
}

function elementByText(text) {
  return element(by.text(text)).atIndex(0);
}

async function tapById(id) {
  await elementById(id).tap();
}

async function tapByText(text) {
  await elementByText(text).tap();
}

async function visibleByText(text) {
  await expect(elementByText(text)).toBeVisible();
}

async function visibleById(id) {
  await expect(elementById(id)).toBeVisible();
}

async function notVisibleById(id) {
  await expect(elementById(id)).not.toBeVisible();
}

async function notVisibleByText(text) {
  await expect(elementByText(text)).not.toBeVisible();
}

async function exitEditor() {
  await detox.device.pressBack();
  await detox.device.pressBack();
}

async function createNote(_title, _body) {
  let title = _title || "Test note description that ";
  let body =
    _body ||
    "Test note description that is very long and should not fit in text.";

  await tapById(notesnook.buttons.add);
  let webview = web(by.id(notesnook.editor.id));
  await expect(webview.element(by.web.className("ProseMirror"))).toExist();
  await webview.element(by.web.className("ProseMirror")).tap();
  await webview.element(by.web.className("ProseMirror")).typeText(body, true);
  await exitEditor();
  await expect(element(by.text(body))).toBeVisible();

  return { title, body };
}

async function openSideMenu() {
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
  await sleep(100);
}

async function navigate(screen) {
  await sleep(500);
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
  await sleep(500);
  await elementByText(screen).tap();
}

const testvars = {
  isFirstTest: true
};

async function prepare() {
  if (testvars.isFirstTest) {
    console.log("Launching App Directly without reset");
    testvars.isFirstTest = false;
    return await LaunchApp();
  }
  await device.reverseTcpPort(8081);
  await device.uninstallApp();
  await device.installApp();
  await device.launchApp({ newInstance: true });
  await LaunchApp();
}

async function matchSnapshot(element, name) {
  let path = await element.takeScreenshot(name);
  const bitmapBuffer = fs.readFileSync(path);
  jestExpect(bitmapBuffer).toMatchImageSnapshot();
}

module.exports = {
  matchSnapshot,
  prepare,
  LaunchApp,
  createNote,
  navigate,
  openSideMenu,
  notVisibleById,
  notVisibleByText,
  visibleById,
  visibleByText,
  tapById,
  tapByText,
  elementByText,
  elementById,
  sleep,
  exitEditor
};
