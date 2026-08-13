/* eslint-disable @typescript-eslint/no-var-requires */
import "@azure/core-asynciterator-polyfill";
import "@formatjs/intl-locale/polyfill-force";
import "@formatjs/intl-pluralrules/polyfill-force";
import "@formatjs/intl-pluralrules/locale-data/en";
import "react-native-url-polyfill/auto";
import "./polyfills/console-time.js";
import "./app/common/logger/index";
import { setI18nGlobal, getSupportedLocale } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import OpenPGP from "react-native-fast-openpgp";

OpenPGP.useJSI = false;

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

import SettingsService from "./app/services/settings";

const localeCatalogs = {
  en: require("@notesnook/intl/dist/locales/$en.json").messages,
  fr: require("@notesnook/intl/dist/locales/$fr.json").messages,
  es: require("@notesnook/intl/dist/locales/$es.json").messages,
  de: require("@notesnook/intl/dist/locales/$de.json").messages,
  it: require("@notesnook/intl/dist/locales/$it.json").messages
};


export function initLocale() {
  const savedLanguage = SettingsService.getProperty("appLanguage");
  let targetLang;

  if (savedLanguage && localeCatalogs[savedLanguage]) {
    targetLang = savedLanguage;
  } else {
    let systemLocale = "en";
    try {
      systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (e) {}
    targetLang = getSupportedLocale(systemLocale);
  }

  i18n.load(localeCatalogs);
  i18n.activate(targetLang);
  setI18nGlobal(i18n);
  return targetLang;
}

initLocale();

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
