const REGEX = /^data:(image\/.+);base64,(.+)/;

function toObject(dataurl) {
  const regexResult = REGEX.exec(dataurl);
  if (!regexResult || regexResult.length < 3) return {};
  const [_, mime, data] = regexResult;
  return { mime, data };
}

function fromObject({ type, data }) {
  if (REGEX.test(data)) return data;
  return `data:${type};base64,${data}`;
}

const dataurl = { toObject, fromObject };
export default dataurl;
