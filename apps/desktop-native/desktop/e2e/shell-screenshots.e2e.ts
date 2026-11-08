import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, vi } from "vitest";
import { listTitles } from "./nav";
import { launchApp } from "@react-native-gpui/testing";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const titles = [
  "Meeting notes",
  "Grocery list",
  "Project plan for the next quarter",
  "Travel itinerary",
  "Book recommendations",
  "Recipe: lentil soup",
  "Ideas",
  "Reading list"
];
const seed = titles.map((title, index) => ({
  title,
  content: `${title}. A short body of text that continues for a few words so the list shows a headline under the title.`,
  favorite: index % 3 === 0,
  dateEdited: NOW - index * (index < 4 ? 3 * 60 * 60 * 1000 : 9 * DAY),
  dateCreated: NOW - index * (index < 4 ? 3 * 60 * 60 * 1000 : 9 * DAY)
}));

const out = process.env.SHOT_DIR;

test.skipIf(!out)(
  "screenshots of the shell in light and dark",
  async () => {
    mkdirSync(out!, { recursive: true });
    const dataDir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"));
    for (const scheme of ["light", "dark"] as const) {
      const app = await launchApp({
        disableAnimations: true,
        timeout: 120000,
        initialProps: { seed, resetConfig: true, initialColorScheme: scheme },
        env: { RN_GPUI_APP_DATA_DIR: path.join(dataDir, scheme) }
      });
      try {
        await app.setWindowSize(1200, 800);
        await vi.waitFor(
          async () =>
            expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
          { timeout: 60000, interval: 500 }
        );
        await vi.waitFor(
          async () => expect((await listTitles(app)).length).toBeGreaterThan(5),
          { timeout: 30000, interval: 500 }
        );
        await app.mouseMove({ x: 4, y: 4 });
        await app.waitForIdle();
        writeFileSync(
          path.join(out!, `desktop-shell-${scheme}.png`),
          await app.screenshot()
        );
      } finally {
        await app.close();
      }
    }
  },
  240000
);
