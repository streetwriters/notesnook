const { Page, test, expect } = require("@playwright/test");

function runClipboardTest(data) {
  test(`a pasted ${data.name} codeblock should get highlighted`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);

    await page.waitForSelector("#mytextarea_ifr", { state: "visible" });

    await copy(page, data.formats);

    await page.click("#mytextarea_ifr");

    await page.keyboard.press("Control+V");

    const frame = page.frame({
      name: "mytextarea_ifr",
    });

    await frame.waitForSelector(`${data.selector} span`);

    const html = await frame.innerHTML("body");

    expect(html).toMatchSnapshot(`${data.name}.txt`);
  });
}
module.exports = { runClipboardTest };

async function copy(page, formats) {
  await page.evaluate(
    async (data) => {
      const { formats } = data;
      document.oncopy = function(e) {
        e.preventDefault();
        for (let format of formats) {
          e.clipboardData.setData(format.type, format.data);
        }
      };

      function copyToClipboard(text) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          return document.execCommand("copy");
        } catch (ex) {
          console.warn("Copy to clipboard failed.", ex);
          return false;
        } finally {
          document.body.removeChild(textarea);
        }
      }
      copyToClipboard("hello");
    },
    { formats }
  );
}
