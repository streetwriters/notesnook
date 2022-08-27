import {
  tapById,
  visibleByText,
  createNote,
  prepare,
  elementById,
  sleep
} from "./utils";

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
