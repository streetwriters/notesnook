import { Platform } from "react-native";
import Sodium from "react-native-sodium";
import RNFetchBlob from "rn-fetch-blob";
import { cacheDir, getRandomId } from "./utils";

export async function readEncrypted(filename, key, cipherData) {
  let path = `${cacheDir}/${filename}`;
  try {
    let exists = await RNFetchBlob.fs.exists(path);
    if (!exists) {
      return false;
    }

    let output = await Sodium.decryptFile(
      key,
      {
        ...cipherData,
        hash: filename
      },
      true
    );
    console.log("output length: ", output?.length);
    return output;
  } catch (e) {
    RNFetchBlob.fs.unlink(path).catch(console.log);
    console.log(e);
    console.log("error");
    return false;
  }
}

export async function writeEncrypted(filename, { data, type, key }) {
  console.log("file input: ", { type, key });
  let filepath = cacheDir + `/${getRandomId("imagecache_")}`;
  console.log(filepath);
  await RNFetchBlob.fs.writeFile(filepath, data, "base64");
  let output = await Sodium.encryptFile(key, {
    uri: Platform.OS === "ios" ? filepath : "file://" + filepath,
    type: "url"
  });
  RNFetchBlob.fs.unlink(filepath).catch(console.log);

  console.log("encrypted file output: ", output);
  return {
    ...output,
    alg: "xcha-stream"
  };
}

export async function deleteFile(filename, data) {
  let delFilePath = cacheDir + `/${filename}`;
  if (!data) {
    if (!filename) return;
    RNFetchBlob.fs.unlink(delFilePath).catch(console.log);
    return true;
  }

  let { url, headers } = data;
  try {
    let response = await RNFetchBlob.fetch("DELETE", url, headers);
    let status = response.info().status;
    let ok = status >= 200 && status < 300;
    if (ok) {
      RNFetchBlob.fs.unlink(delFilePath).catch(console.log);
    }
    return ok;
  } catch (e) {
    console.log("delete file: ", e, url, headers);
    return false;
  }
}

export async function clearFileStorage() {
  try {
    let files = await RNFetchBlob.fs.ls(cacheDir);
    for (let file of files) {
      try {
        await RNFetchBlob.fs.unlink(cacheDir + `/${file}`);
      } catch (e) {
        console.log(e);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

export async function exists(filename) {
  let exists = await RNFetchBlob.fs.exists(`${cacheDir}/${filename}`);
  return exists;
}
