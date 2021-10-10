import FileHandle from "./filehandle";

export interface IStreamableFS {
  createFile(filename: string, size: number, type: string): Promise<FileHandle>;
  readFile(filename: string): Promise<FileHandle>;
  exists(filename: string): Promise<boolean>;
  deleteFile(filename: string): Promise<void>;
}
