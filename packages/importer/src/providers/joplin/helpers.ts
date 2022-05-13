import BaseModel, { ModelType } from "@joplin/lib/BaseModel";

// Taken from https://github.com/laurent22/joplin/blob/6f1a806e5c7159a544de5d997b189e0e83a9d8ea/packages/lib/models/BaseItem.ts#L477-L523
export async function unserialize(content: string) {
  const lines = content.split("\n");
  let output: any = {};
  let state = "readingProps";
  const body: string[] = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    let line = lines[i];

    if (state == "readingProps") {
      line = line.trim();

      if (line == "") {
        state = "readingBody";
        continue;
      }

      const p = line.indexOf(":");
      if (p < 0)
        throw new Error(`Invalid property format: ${line}: ${content}`);
      const key = line.substr(0, p).trim();
      const value = line.substr(p + 1).trim();
      output[key] = value;
    } else if (state == "readingBody") {
      body.splice(0, 0, line);
    }
  }

  if (!output.type_)
    throw new Error(`Missing required property: type_: ${content}`);
  output.type_ = Number(output.type_);

  if (body.length) {
    const title = body.splice(0, 2);
    output.title = title[0];
  }

  if (output.type_ === BaseModel.TYPE_NOTE) output.body = body.join("\n");

  for (const n in output) {
    if (!output.hasOwnProperty(n)) continue;
    output[n] = await unserialize_format(output.type_, n, output[n]);
  }
  return output;
}

// Taken from https://github.com/laurent22/joplin/blob/dev/packages/lib/models/BaseItem.ts#L325-L351
// slightly modified to remove all database related code
function unserialize_format(type: ModelType, propName: string, propValue: any) {
  if (propName[propName.length - 1] == "_") return propValue; // Private property

  if (["title_diff", "body_diff"].indexOf(propName) >= 0) {
    if (!propValue) return "";
    propValue = JSON.parse(propValue);
  } else if (["longitude", "latitude", "altitude"].indexOf(propName) >= 0) {
    const places = propName === "altitude" ? 4 : 8;
    propValue = Number(propValue).toFixed(places);
  } else {
    if (
      [
        "created_time",
        "updated_time",
        "user_created_time",
        "user_updated_time",
      ].indexOf(propName) >= 0
    ) {
      propValue = !propValue ? "0" : new Date(propValue).getTime();
    }
  }

  if (propName === "body") return propValue;

  return typeof propValue === "string"
    ? propValue
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\\n/g, "\\n")
        .replace(/\\\r/g, "\\r")
    : propValue;
}
