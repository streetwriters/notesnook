const REGEX = /^data:(image\/.+);base64,(.+)/;

export type Dataurl = { mime: string; data: string };

export function parseDataurl(dataurl: string): Dataurl | undefined {
  const regexResult = REGEX.exec(dataurl);
  if (!regexResult || regexResult.length < 3) return;
  const [_, mime, data] = regexResult;
  return { mime, data };
}

// export function fromObject({ type, data }) {
//   if (REGEX.test(data)) return data;
//   return `data:${type};base64,${data}`;
// }
