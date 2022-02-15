/* eslint-disable no-undef */
const { getTestId } = require("./index");
const Menu = require("./menuitemidbuilder");

async function navigateTo(pageId) {
  await page.click(Menu.new("navitem").item(pageId).build());
}

async function clickMenuItem(itemId) {
  await page.click(Menu.new("menuitem").item(itemId).build(), {
    button: "left",
    force: true,
  });
}

async function openContextMenu(selector) {
  await page.click(selector, { button: "right" });
}

async function closeContextMenu() {
  await page.keyboard.press("Escape");
}

async function useContextMenu(selector, action, close = false) {
  await openContextMenu(selector);

  await action();

  if (close) await closeContextMenu();
}

async function confirmDialog() {
  await page.click(getTestId("dialog-yes"));
}

module.exports = {
  navigateTo,
  clickMenuItem,
  openContextMenu,
  confirmDialog,
  closeContextMenu,
  useContextMenu,
};
