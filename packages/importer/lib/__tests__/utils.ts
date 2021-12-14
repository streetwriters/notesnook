import fs from "fs";
import path from "path";
import { IFile } from "../src/utils/file";
import { fdir } from "fdir";

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
