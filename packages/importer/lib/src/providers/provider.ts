import { Note } from "../models/note";
import { File } from "../utils/file";
import { IHasher } from "../utils/hasher";

export interface IProvider {
  supportedExtensions: string[];
  version: string;
  name: string;
  process(files: File[], settings: ProviderSettings): Promise<Note[]>;
}

export interface ProviderSettings {
  hasher: IHasher;
}
