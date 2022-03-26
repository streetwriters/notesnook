import tap from "tap";
import { ProviderFactory } from "../src/providers/providerfactory";
import { hasher } from "./utils";
import sinon from "sinon";
import { OneNoteClient } from "@notesnook/onenote";
import { Notebook } from "@microsoft/microsoft-graph-types-beta";
import Data from "./data/onenote/notebooks.json";
import { Content } from "@notesnook/onenote/dist/src/content";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { pack } from "../src/utils/archiver";
import { unzipSync } from "fflate";

tap.afterEach(() => {
  sinon.reset();
  sinon.restore();
});

const notebooks: Notebook[] = Data as Notebook[];
tap.test(
  `transform OneNote data to Notesnook importer compatible format`,
  async () => {
    const output = await importFromOnenote();
    output.notes.forEach((n) => {
      n.attachments?.forEach((a) => {
        a.data = undefined;
      });
    });
    tap.matchSnapshot(JSON.stringify(output.notes), "onenote");
  }
);

tap.test(
  `transform & pack OneNote data to Notesnook importer compatible format`,
  async () => {
    const output = pack((await importFromOnenote()).notes);
    const unzipped = unzipSync(output);
    tap.matchSnapshot(Object.keys(unzipped), `onenote-packed`);
  }
);

async function importFromOnenote() {
  const provider = ProviderFactory.getProvider("onenote");
  sinon.replace(OneNoteClient.prototype, "getNotebooks", async () => {
    for (let notebook of notebooks) {
      for (let section of notebook.sections ?? []) {
        if (!section.pages) continue;

        for (let i = 0; i < section.pages.length; ++i) {
          const page = section.pages[i];
          if (typeof page.content === "string")
            page.content = new Content(page.content, {
              attachmentResolver: async (url) => {
                const filePath = path.join(
                  __dirname,
                  "data",
                  "onenote",
                  md5(url)
                );
                return fs.readFileSync(filePath);
              },
            });
        }
      }
    }
    return notebooks;
  });

  const output = await provider.process({
    clientId: "",
    clientType: "node",
    hasher,
  });
  return output;
}

function md5(str: string) {
  return crypto
    .createHash("md5")
    .update(str)
    .digest("hex");
}
