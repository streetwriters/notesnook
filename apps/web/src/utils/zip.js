import uzip from "uzip";
import { sanitizeFilename } from "./filename";

const textEncoder = new TextEncoder();
function zip(files, format) {
  const obj = {};
  files.forEach((file) => {
    obj[`${sanitizeFilename(file.filename)}.${format}`] = textEncoder.encode(
      file.content
    );
  });
  return uzip.encode(obj);
}
export { zip };
