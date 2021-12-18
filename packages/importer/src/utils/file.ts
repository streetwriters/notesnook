import { path } from "./path";

export interface IFile {
  data: Uint8Array | ArrayBuffer | Buffer;
  name: string;
  path?: string;
  createdAt?: number;
  modifiedAt?: number;
}

const textDecoder = new TextDecoder();
export class File {
  constructor(private readonly file: IFile) {}

  get name(): string {
    return this.file.name;
  }

  get nameWithoutExtension(): string {
    return path.basename(this.file.name, false);
  }

  get directory(): string | undefined {
    if (!this.path) return;
    return path.dirname(this.path);
  }

  get text(): string {
    return textDecoder.decode(this.bytes);
  }

  get bytes(): Uint8Array | Buffer {
    if (this.file.data instanceof ArrayBuffer)
      return new Uint8Array(this.file.data);
    return this.file.data;
  }

  get extension(): string | undefined {
    return (
      this.path ? path.extname(this.path) : path.extname(this.name)
    ).toLowerCase();
  }

  get path(): string | undefined {
    return this.file.path;
  }

  get createdAt(): number | undefined {
    return this.file.createdAt;
  }

  get modifiedAt(): number | undefined {
    return this.file.modifiedAt;
  }
}
