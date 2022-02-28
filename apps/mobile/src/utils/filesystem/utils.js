import RNFetchBlob from 'rn-fetch-blob';

export const cacheDir = RNFetchBlob.fs.dirs.CacheDir;

export function getRandomId(prefix) {
  return Math.random()
    .toString(36)
    .replace('0.', prefix || '');
}

export function extractValueFromXmlTag(code, xml) {
  if (!xml.includes(code)) return `Unknown ${code}`;
  return xml.slice(xml.indexOf(`<${code}>`) + code.length + 2, xml.indexOf(`</${code}>`));
}

export async function fileCheck(response, totalSize) {
  if (totalSize < 1000) {
    let text = await response.text();
    console.log(text);
    if (text.startsWith('<?xml')) {
      let errorJson = {
        Code: extractValueFromXmlTag('Code', text),
        Message: extractValueFromXmlTag('Message', text)
      };
      throw new Error(`${errorJson.Code}: ${errorJson.Message}`);
    }
  }
}

export function cancelable(operation) {
  const cancelToken = {
    cancel: () => {}
  };
  return (filename, { url, headers }) => {
    return {
      execute: () => operation(filename, { url, headers }, cancelToken),
      cancel: async () => {
        await cancelToken.cancel();
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log);
      }
    };
  };
}
