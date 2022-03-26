import tap from "tap";
import { Znel } from "../index";
import fs from "fs";
import path from "path";
import { fdir } from "fdir";

tap.test("znel should be parsed correctly", async () => {
  const dataDirectoryPath = path.join(__dirname, "data");
  const znelFiles = await new fdir()
    .withFullPaths()
    .filter((p) => p.endsWith(".znel"))
    .crawl(dataDirectoryPath)
    .withPromise();
  for (let filePath of <string[]>znelFiles) {
    const znelFile = fs.readFileSync(filePath, "utf-8");
    const znel = new Znel(znelFile);
    tap.matchSnapshot(toJSON(znel), path.basename(filePath));
  }
});

function toJSON(thisArg: any) {
  const proto = Object.getPrototypeOf(thisArg);
  const jsonObj: any = Object.assign({}, thisArg);

  Object.entries(Object.getOwnPropertyDescriptors(proto))
    .filter(([key, descriptor]) => typeof descriptor.get === "function")
    .map(([key, descriptor]) => {
      if (descriptor && key[0] !== "_") {
        try {
          const val = (thisArg as any)[key];
          if (val && Array.isArray(val)) {
            const array = [];
            for (let item of val) {
              if (typeof item === "object") array.push(toJSON(item));
              else array.push(item);
            }
            jsonObj[key] = array;
          } else if (val && !(val instanceof Date) && typeof val === "object") {
            jsonObj[key] = toJSON(val);
          } else {
            jsonObj[key] = val;
          }
        } catch (error) {
          console.error(`Error calling getter ${key}`, error);
        }
      }
    });

  return jsonObj;
}
