import tap from "tap";
import { pack, transform } from "../index";
import { getFiles } from "./utils";
import { xxh64 } from "@node-rs/xxhash";
import { IHasher } from "../src/utils/hasher";
import { ProviderFactory, Providers } from "../src/providers/providerfactory";
import { unzipSync } from "fflate";

const hasher: IHasher = {
  hash: async (data) => {
    if (data instanceof Uint8Array)
      return xxh64(Buffer.from(data.buffer)).toString(16);
    return xxh64(data).toString(16);
  },
  type: "xxh64",
};

const settings = { hasher };
for (let provider of ProviderFactory.getAvailableProviders()) {
  const files = getFiles(provider);
  if (files.length <= 0) continue;

  tap.test(
    `transform ${provider} files to notesnook importer compatible format`,
    async () => {
      const output = await transform(files, <Providers>provider, settings);
      output.notes.forEach((n) => {
        n.attachments?.forEach((a) => {
          a.data = undefined;
        });
      });
      tap.matchSnapshot(JSON.stringify(output), provider);
    }
  );

  tap.test(
    `transform & pack ${provider} files to notesnook importer compatible format`,
    async () => {
      const output = pack(
        (await transform(files, <Providers>provider, settings)).notes
      );
      const unzipped = unzipSync(output);
      tap.matchSnapshot(Object.keys(unzipped), `${provider}-packed`);
    }
  );
}
