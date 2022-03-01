import "isomorphic-fetch"; // or import the fetch polyfill you installed
import { getNotebooks } from "./src/api";
import fs from "fs";

async function main() {
  // const output = await new Content(html).transform();
  // fs.writeFileSync("output.html", output);
  // console.log(
  //   await resolveDataUrl(
  //     `https://graph.microsoft.com/v1.0/users('thecodrr@hotmail.com')/onenote/resources/0-ad21f35a5bb54ee68774d558b0d2451e!1-59E46DB31C5BA18C!2898/$value`
  //   )
  // );
  const notebooks = await getNotebooks({
    report: ({ op, type, current, total }) => {
      console.log(`[${op}]`, `[${type}]`, `${current}/${total}`);
    },
  });

  fs.writeFileSync("all.json", JSON.stringify(notebooks, undefined, "  "));
  // const resources = await getPageContent(
  //   `0-6ae98c2dbb9e47c982049476118a49c4!105-59E46DB31C5BA18C!2898`
  // );
  // if (!resources) return;
  // fs.writeFileSync("page.html", resources);
}
main();
