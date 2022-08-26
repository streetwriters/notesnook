const { notesnook } = require("../test.ids");
const {
  navigate,
  tapById,
  visibleByText,
  createNote,
  prepare,
  visibleById,
  notVisibleById,
  elementById,
  tapByText,
  notVisibleByText
} = require("./utils");
const { sleep } = require("./utils");

describe("Search", () => {
  it("Search for a note", async () => {
    await prepare();
    let note = await createNote();
    await tapById("icon-search");
    await sleep(300);
    await elementById("search-input").typeText("n");
    await sleep(1000);
    await visibleByText(note.body);
  });
});
