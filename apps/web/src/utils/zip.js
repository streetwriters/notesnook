import { sanitizeFilename } from "./filename";

const textEncoder = new TextEncoder();
async function zip(files, format) {
  const obj = {};
  files.forEach((file) => {
    obj[`${sanitizeFilename(file.filename)}.${format}`] = textEncoder.encode(
      file.content
    );
  });
  const { zipSync } = await import("fflate");
  return zipSync(obj);
}
export { zip };
