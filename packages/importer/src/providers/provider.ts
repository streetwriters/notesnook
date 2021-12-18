import { Note } from "../models/note";
import { File } from "../utils/file";
import { IHasher } from "../utils/hasher";
import { TransformError } from "../utils/transformerror";

export interface IProvider {
  supportedExtensions: string[];
  validExtensions: string[];
  version: string;
  name: string;
  process(files: File[], settings: ProviderSettings): Promise<ProviderResult>;
}

export interface ProviderSettings {
  hasher: IHasher;
}

export type ProviderResult = {
  errors: TransformError[];
  notes: Note[];
};

type ProcessAction = (
  file: File,
  notes: Note[],
  errors: TransformError[]
) => Promise<boolean>;

/**
 * Iterate over files & perform transformation in an error resistant
 * manner. All errors are collected for later processing.
 */
export async function iterate(
  provider: IProvider,
  files: File[],
  process: ProcessAction
): Promise<ProviderResult> {
  const notes: Note[] = [];
  const errors: TransformError[] = [];

  for (const file of files) {
    if (file.extension) {
      if (!provider.validExtensions.includes(file.extension)) {
        errors.push(new TransformError("Invalid file type.", file));
        continue;
      } else if (!provider.supportedExtensions.includes(file.extension))
        continue;
    }

    try {
      if (!(await process(file, notes, errors))) continue;
    } catch (e) {
      errors.push(new TransformError((<Error>e).message, file));
    }
  }

  return { notes, errors };
}
