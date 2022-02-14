import { Unzipped } from "fflate";
import { sanitizeFilename } from "./filename";

const textEncoder = new TextEncoder();
type File = { filename: string; content: string };
async function zip(files: File[], format: string): Promise<Uint8Array> {
  const obj: Unzipped = {};
  files.forEach((file) => {
    obj[`${sanitizeFilename(file.filename)}.${format}`] = textEncoder.encode(
      file.content
    );
  });
  const { zipSync } = await import("fflate");
  return zipSync(obj);
}
export { zip };
