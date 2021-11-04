const { Page, test, expect } = require("@playwright/test");

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
});

test("add a codeblock", async ({ page }) => {
  await page.waitForSelector("#mytextarea_ifr", { state: "visible" });

  await page.click('[aria-label="Codeblock"]');

  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await frame.waitForSelector(".hljs");

  const html = await frame.innerHTML("body");
  expect(html).toMatchSnapshot("codeblock-exists.txt");
});

test("change language to javascript", async ({ page, browser }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame, "function google() { }");

  const html = await frame.innerHTML("body");

  expect(html).toMatchSnapshot("language-js.txt");
});

test("pressing tab in code block adds a tab", async ({ page }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);

  const code = await frame.innerText("body .hljs");
  expect(code).toMatchSnapshot("tabbed-code.txt");
});

test("code highlights as user types", async ({ page }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  const html = await frame.innerHTML("body .hljs.language-javascript");
  expect(html).toMatchSnapshot("realtime-highlighted-code.txt");
});

test("pressing ctrl + A inside code block doesn't select anything outside", async ({
  page,
}) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await page.click("#mytextarea_ifr");

  await page.keyboard.type("Hello world");

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  await page.keyboard.press("Control+A");

  expect(await page.screenshot("#mytextarea_ifr")).toMatchSnapshot(
    "code-select-all.png"
  );
});

test("toggle a code block into a paragraph", async ({ page }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  await page.keyboard.press("Control+A");

  await page.click('[aria-label="Codeblock"]');

  const html = await frame.innerHTML("body");
  expect(html).toMatchSnapshot("toggled-codeblock-to-paragraph.txt");
});

test("toggle a single line of code into a paragraph", async ({ page }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  await page.keyboard.press("Shift+ArrowUp");

  await page.click('[aria-label="Codeblock"]');

  const html = await frame.innerHTML("body");
  expect(html).toMatchSnapshot("toggle-singleline-to-paragraph.txt");
});

test("indent multiple lines", async ({ page }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  await indentMultipleLines(page);

  const code = await frame.innerText("body .hljs");
  expect(code).toMatchSnapshot("multiline-tabbed-code.txt");
});

test("deindent multiple lines", async ({ page }) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  await indentMultipleLines(page);

  // Go backward three tab spaces
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");

  const code = await frame.innerText("body .hljs");
  expect(code).toMatchSnapshot("tabbed-code.txt");
});

test("deindenting and then indenting a line shouldn't erase the newline", async ({
  page,
}) => {
  const frame = page.frame({
    name: "mytextarea_ifr",
  });

  await insertCodeblock(page, frame);
  await typeCode(page);
  await page.waitForTimeout(600);

  // go to the beginning of the previous line
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Home");

  // indent the line 3 times
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  // deindent the line 3 times
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");

  // indent and deindent once
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");

  const code = await frame.innerText("body .hljs");
  expect(code).toMatchSnapshot("tabbed-code.txt");
});

async function insertCodeblock(page, frame, code) {
  await page.waitForSelector("#mytextarea_ifr", { state: "visible" });

  await page.click('[aria-label="Codeblock"]');

  await frame.waitForSelector(".hljs");

  if (code) await page.type("#mytextarea", code);

  // open language selector
  await page.click(`.tox-split-button__chevron`);

  // select language
  await page.click(`[title="Javascript"]`);

  await frame.waitForSelector(".hljs.language-javascript");
}

async function typeCode(page) {
  await page.keyboard.type("function test() {");
  await page.keyboard.press("Enter");
  // indent
  await page.keyboard.press("Tab");
  await page.keyboard.type(`var test_var = "hello";`);
  await page.keyboard.press("Enter");
  await page.keyboard.type(`var test_var2 = "hello2";`);
  await page.keyboard.press("Enter");
  // deindent
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("}");
}

async function indentMultipleLines(page) {
  // go to the end of the above line
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("End");

  // select 2 lines
  await page.keyboard.press("Shift+ArrowUp");
  await page.keyboard.press("Shift+ArrowUp");

  // Deselect the last character of the first line
  await page.keyboard.press("Shift+ArrowRight");

  // Go forward three tab spaces
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
}
