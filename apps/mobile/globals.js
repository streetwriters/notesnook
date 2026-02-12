/* eslint-disable @typescript-eslint/no-var-requires */
import "@azure/core-asynciterator-polyfill";
import "@formatjs/intl-locale/polyfill-force";
import "@formatjs/intl-pluralrules/polyfill-force";
import "@formatjs/intl-pluralrules/locale-data/en";
import "react-native-url-polyfill/auto";
import "./polyfills/console-time.js";
import "./app/common/logger/index";
import { setI18nGlobal } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import Config from "react-native-config";

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

if (__DEV__ && Config.isTesting !== "true") {
  const messages =
    require("@notesnook/intl/dist/locales/$pseudo-LOCALE.json").messages;
  i18n.load({
    en: messages
  });
} else {
  const messages = require("@notesnook/intl/dist/locales/$en.json").messages;
  i18n.load({
    en: messages
  });
}

i18n.activate("en");
setI18nGlobal(i18n);

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
