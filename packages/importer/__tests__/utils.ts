import fs from "fs";
import path from "path";
import { IFile } from "../src/utils/file";
import { fdir } from "fdir";
import { IHasher } from "../src/utils/hasher";
import { xxh64 } from "@node-rs/xxhash";

export function getFiles(dir: string): IFile[] {
  const output = new fdir()
    .withFullPaths()
    .withSymlinks()
    .crawl(path.join(__dirname, `data`, dir))
    .sync() as string[];
  return output.map(pathToFile);
}

export function pathToFile(filePath: string): IFile {
  let data = fs.readFileSync(filePath);

  return {
    data: data,
    name: path.basename(filePath),
    path: filePath,
  };
}

export const hasher: IHasher = {
  hash: async (data) => {
    if (data instanceof Uint8Array)
      return xxh64(Buffer.from(data.buffer)).toString(16);
    return xxh64(data).toString(16);
  },
  type: "xxh64",
};
