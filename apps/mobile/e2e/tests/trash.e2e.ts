import { notesnook } from "../test.ids";
import { TestBuilder } from "./utils";

describe("TRASH TESTS", () => {
  it("Move a note to trash", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Test", "Test note item")
      .tapById(notesnook.listitem.menu)
      .tapById("icon-trash")
      .navigate("Trash")
      .wait(500)
      .isVisibleByText("Test")
      .run();
  });

  it("Permanently remove a note from trash", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Test", "Test note item")
      .tapById(notesnook.listitem.menu)
      .tapById("icon-trash")
      .navigate("Trash")
      .wait(500)
      .isVisibleByText("Test")
      .tapById("trash-clear")
      .tapByText("Clear")
      .wait(100)
      .isNotVisibleByText("Test")
      .navigate("Notes")
      .isNotVisibleByText("Test")
      .run();
  });

  it("Clear all notes from side menu", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Test", "Test note item")
      .tapById(notesnook.listitem.menu)
      .tapById("icon-trash")
      .navigate("Trash")
      .wait(500)
      .isVisibleByText("Test")
      .openSideMenu()
      .longPressByText("Trash")
      .tapByText("Clear trash")
      .wait(500)
      .tapByText("Clear")
      .tapByText("Trash")
      .isNotVisibleByText("Test")
      .run();
  });
});
