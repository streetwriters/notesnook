const { navigate, tapByText, prepare, sleep } = require("./utils");

describe("APP LAUNCH AND NAVIGATION", () => {
  it("App should launch successfully & hide welcome screen", async () => {
    await prepare();
  });

  it("Basic navigation should work", async () => {
    await prepare();
    await navigate("Notebooks");
    await tapByText("Skip introduction");
    await sleep(500);
    await navigate("Favorites");
    await navigate("Trash");
    await navigate("Tags");
    await navigate("Settings");
    await navigate("Monographs");
    await navigate("Notes");
  });
});
