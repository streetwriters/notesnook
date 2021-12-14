import { zipSync, unzipSync, Unzipped } from "fflate";
import { path } from "./path";
import { Note } from "../models/note";
import { File, IFile } from "./file";
import SparkMD5 from "spark-md5";

const metadataFilename = "metadata.json";
const noteDataFilename = "note.json";
const attachmentsDirectory = "attachments";
const md5 = new SparkMD5.ArrayBuffer();
const textEncoder = new TextEncoder();

type PackageMetadata = {
  version: string;
  notes: string[];
};

type NoteFiles = {
  files: Record<string, Uint8Array>;
  hash: string;
};

export function unpack(files: IFile[], root?: string): File[] {
  const extracted: File[] = [];

  for (let file of files) {
    if (file.name.endsWith(".zip")) {
      try {
        const root = path.basename(file.name, false);
        extracted.push(...unpack(unzip(file), root));
      } catch (e) {
        continue;
      }
    } else {
      if (file.path && root) file.path = path.join(root, file.path);
      extracted.push(new File(file));
    }
  }

  return extracted;
}

export function pack(notes: Note[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const metadata: PackageMetadata = {
    version: "1.0.0",
    notes: [],
  };

  for (let note of notes) {
    const { files: noteFiles, hash } = filefy(note);
    for (let key in noteFiles) {
      const filePath = path.join(hash, key);
      files[filePath] = noteFiles[key];
    }
    metadata.notes.push(hash);
  }
  files[metadataFilename] = textEncoder.encode(JSON.stringify(metadata));
  return zipSync(files, { level: 9, mem: 12 });
}

function filefy(note: Note): NoteFiles {
  const files: Record<string, Uint8Array> = {};

  if (note.attachments) {
    for (let attachment of note.attachments) {
      if (!attachment.data) continue;
      const filePath = path.join(attachmentsDirectory, attachment.hash);
      files[filePath] = attachment.data;
      attachment.data = undefined;
    }
  }

  const noteData = textEncoder.encode(JSON.stringify(note));
  const noteDataHash = md5.append(noteData).end();
  files[noteDataFilename] = noteData;
  return { files, hash: noteDataHash };
}

function unzip(file: IFile): IFile[] {
  const extracted: IFile[] = [];
  let entries: Unzipped = {};
  if (file.data instanceof Uint8Array || file.data instanceof Buffer) {
    entries = unzipSync(file.data);
  } else if (file.data instanceof ArrayBuffer) {
    entries = unzipSync(new Uint8Array(file.data));
  }

  for (let entry in entries) {
    const data = entries[entry];
    if (!data || data.length <= 0) continue;
    extracted.push({ data, name: path.basename(entry, true), path: entry });
  }

  return extracted;
}
