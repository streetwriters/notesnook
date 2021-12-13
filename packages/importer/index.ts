import { ProviderFactory, Providers } from "./src/providers/providerfactory";
import type { IFile } from "./src/utils/file";
import { Note } from "./src/models/note";
import { unpack } from "./src/utils/archiver";
import { ProviderSettings } from "./src/providers/provider";

export function transform(
  files: IFile[],
  provider: Providers,
  settings: ProviderSettings
): Promise<Note[]> {
  return ProviderFactory.getProvider(provider).process(unpack(files), settings);
}

export { pack } from "./src/utils/archiver";
