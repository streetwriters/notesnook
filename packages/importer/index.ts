import {
  IFileProvider,
  ProviderResult,
  ProviderSettings,
} from "./src/providers/provider";
import { unpack } from "./src/utils/archiver";
import { IFile } from "./src/utils/file";

export { pack } from "./src/utils/archiver";
export { ProviderFactory } from "./src/providers/providerfactory";
export {
  IFileProvider,
  INetworkProvider,
  IProvider,
} from "./src/providers/provider";

export function transform(
  provider: IFileProvider,
  files: IFile[],
  settings: ProviderSettings
): Promise<ProviderResult> {
  return provider.process(unpack(files), settings);
}
