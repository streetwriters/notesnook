import { sanitizeFilename } from "./filename";

const textEncoder = new TextEncoder();
async function zip(files, format) {
  const obj = {};
  files.forEach((file) => {
    obj[`${sanitizeFilename(file.filename)}.${format}`] = textEncoder.encode(
      file.content
    );
  });
  const uzip = await import("uzip");
  return uzip.encode(obj);
}
export { zip };
