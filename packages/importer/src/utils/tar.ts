import { path } from "./path";
import { Reader } from "./reader";

enum Type {
  Dir,
  File,
}

export interface TarHeader {
  readonly size: number;
  readonly name: string;
  readonly type: Type;
}

export class TarFile {
  public constructor(
    public readonly header: TarHeader,
    private readonly offset: number,
    private readonly reader: Reader
  ) {}

  public read(): Uint8Array;
  public read(encoding: "utf8"): string;
  public read(encoding?: "utf8"): Uint8Array | string {
    return this.reader
      .jump(this.offset)
      .read(this.header.size, encoding as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export class Tar {
  readonly files = new Map<string, TarFile>();

  public getFile(filePath: string): TarFile | undefined {
    return this.files.get(filePath);
  }

  public static fromUint8Array(array: Uint8Array): Tar {
    const reader = new Reader(array);
    const gzipBytes = reader.peek(2);
    if (gzipBytes[0] === 0x1f && gzipBytes[1] === 0x8b) {
      throw new Error("gzipped tars are not supported");
    }
    const tar = new Tar();
    let file: TarFile | undefined;
    while ((file = Tar.getNextFile(reader))) {
      if (file.header.type === Type.File) {
        tar.files.set(path.normalize(file.header.name), file);
      }
    }
    reader.unclamp();
    return tar;
  }

  private static getNextFile(reader: Reader): TarFile | undefined {
    if (reader.eof()) {
      return undefined;
    }

    const header = Tar.parseHeader(reader);
    reader.jump(512);
    const offset = reader.offset;
    reader.skip(header.size);

    // Blocks are 512 in size and the remaining will be padding so we need to
    // skip past however much padding there is for the last block.
    const overflow = header.size & 511;
    if (overflow > 0) {
      reader.skip(512 - overflow);
    }

    // There can also be empty padding block(s) after a file.
    try {
      while (reader.peek(1)[0] === 0x00) {
        reader.skip(512);
      }
    } catch (error) {
      // EOF
    }

    reader.clamp();

    return new TarFile(header, offset, reader);
  }

  // See https://www.gnu.org/software/tar/manual/html_node/Standard.html
  private static parseHeader(reader: Reader): TarHeader {
    // Tar uses base256 encoding for very large numbers. 0xff is a negative
    // number and 0x80 is a positive number.
    const sign = reader.jump(124).peek(1)[0];
    if (sign === 0xff || sign === 0x80) {
      throw new Error("base256 encoding not supported");
    }

    const prefix = reader.jump(345).read(155, "utf8");
    return {
      name: (prefix ? prefix + "/" : "") + reader.jump(0).read(100, "utf8"),
      size: parseInt(reader.jump(124).read(12, "utf8"), 8),
      type: reader.jump(156).read(1)[0] === 53 ? Type.Dir : Type.File,
    };
  }
}
