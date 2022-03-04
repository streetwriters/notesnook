import { Note } from "../models/note";
import { File } from "../utils/file";
import { IHasher } from "../utils/hasher";

export type ProviderType = "network" | "file";

interface IBaseProvider<T extends ProviderType> {
  type: T;
  version: string;
  name: string;
}

export interface IFileProvider extends IBaseProvider<"file"> {
  supportedExtensions: string[];
  validExtensions: string[];
  process(files: File[], settings: ProviderSettings): Promise<ProviderResult>;
}

export interface INetworkProvider<TSettings> extends IBaseProvider<"network"> {
  process(settings: TSettings): Promise<ProviderResult>;
}

export type IProvider = IFileProvider | INetworkProvider<unknown>;

export interface ProviderSettings {
  clientType: "browser" | "node";
  hasher: IHasher;
}

export type ProviderResult = {
  errors: Error[];
  notes: Note[];
};

type ProcessAction = (
  file: File,
  notes: Note[],
  errors: Error[]
) => Promise<boolean>;

/**
 * Iterate over files & perform transformation in an error resistant
 * manner. All errors are collected for later processing.
 */
export async function iterate(
  provider: IFileProvider,
  files: File[],
  process: ProcessAction
): Promise<ProviderResult> {
  const notes: Note[] = [];
  const errors: Error[] = [];

  for (const file of files) {
    if (file.extension) {
      if (!provider.validExtensions.includes(file.extension)) {
        errors.push(new Error(`Invalid file type: ${file.name}`));
        continue;
      } else if (!provider.supportedExtensions.includes(file.extension))
        continue;
    }

    try {
      if (!(await process(file, notes, errors))) continue;
    } catch (e) {
      errors.push(<Error>e);
    }
  }

  return { notes, errors };
}
