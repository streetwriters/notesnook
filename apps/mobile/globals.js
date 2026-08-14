/* eslint-disable @typescript-eslint/no-var-requires */
import "@azure/core-asynciterator-polyfill";
import "@formatjs/intl-locale/polyfill-force";
import "@formatjs/intl-pluralrules/polyfill-force";
import "@formatjs/intl-pluralrules/locale-data/en";
import "react-native-url-polyfill/auto";
import "./polyfills/console-time.js";
import "./app/common/logger/index";
import OpenPGP from "react-native-fast-openpgp";
import { initLocale } from "./app/common/locale";

OpenPGP.useJSI = false;
initLocale();

let domParser;
Object.defineProperty(global, "DOMParser", {
  get: () => {
    if (!domParser) domParser = require("./worker.js");
    return domParser.DOMParser;
  }
});
let buffer;
Object.defineProperty(global, "Buffer", {
  get: () => {
    if (!buffer) buffer = require("buffer");
    return buffer.Buffer;
  }
});

if (__DEV__) {
  try {
    const { ScriptManager, Script } = require("@callstack/repack/client");
    ScriptManager.shared.addResolver(async (scriptId) => {
      // `scriptId` will be either 'student' or 'teacher'

      // In dev mode, resolve script location to dev server.
      if (__DEV__) {
        return {
          url: Script.getDevServerURL(scriptId),
          cache: false
        };
      }

      return {
        url: Script.getFileSystemURL(scriptId)
      };
    });
  } catch (e) {
    /** ignore error when running with metro bundler */
  }
}
