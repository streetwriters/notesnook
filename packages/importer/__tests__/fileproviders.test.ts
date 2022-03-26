import tap from "tap";
import { pack, transform } from "../index";
import { getFiles, hasher } from "./utils";
import { ProviderFactory } from "../src/providers/providerfactory";
import { unzipSync } from "fflate";
import { ProviderSettings } from "../src/providers/provider";

const settings: ProviderSettings = { hasher, clientType: "node" };
for (let providerName of ProviderFactory.getAvailableProviders()) {
  const provider = ProviderFactory.getProvider(providerName);
  if (provider.type === "network") continue;

  const files = getFiles(providerName);
  if (files.length <= 0) continue;

  tap.test(
    `transform ${providerName} files to notesnook importer compatible format`,
    async () => {
      const output = await transform(provider, files, settings);
      output.notes.forEach((n) => {
        n.attachments?.forEach((a) => {
          a.data = undefined;
        });
      });
      tap.matchSnapshot(JSON.stringify(output.notes), providerName);
    }
  );

  tap.test(
    `transform & pack ${providerName} files to notesnook importer compatible format`,
    async () => {
      const output = pack((await transform(provider, files, settings)).notes);
      const unzipped = unzipSync(output);
      tap.matchSnapshot(Object.keys(unzipped), `${providerName}-packed`);
    }
  );
}
