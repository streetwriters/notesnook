const REGEX = /^data:(?<mime>image\/.+);base64,(?<data>.+)/;

function toObject(dataurl) {
  const { groups } = REGEX.exec(dataurl);
  return groups || {};
}

function fromObject({ type, data }) {
  //const { groups } = REGEX.exec(dataurl);
  return `data:${type};base64,${data}`;
}

const dataurl = { toObject, fromObject };
export default dataurl;
