/* eslint-disable @typescript-eslint/no-var-requires */
import "@azure/core-asynciterator-polyfill";
import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-pluralrules/polyfill'

import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/cs'
import '@formatjs/intl-pluralrules/locale-data/fr'

import 'react-native-url-polyfill/auto';
import "./polyfills/console-time.js"
global.Buffer = require('buffer').Buffer;
import '../app/common/logger/index';
import { DOMParser } from './worker.js';
global.DOMParser = DOMParser;
import {setI18nGlobal } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import { ScriptManager, Script } from '@callstack/repack/client';
import {
  messages as $pseudo
} from "@notesnook/intl/locales/$pseudo-LOCALE.json";

i18n.load({
  "pseudo-LOCALE": $pseudo
});
setI18nGlobal(i18n);
i18n.activate("pseudo-LOCALE");
setI18nGlobal(i18n);


try {
  ScriptManager.shared.addResolver(async (scriptId) => {
    // `scriptId` will be either 'student' or 'teacher'
  
    // In dev mode, resolve script location to dev server.
    if (__DEV__) {
      return {
        url: Script.getDevServerURL(scriptId),
        cache: false,
      };
    }
  
    return {
      url: Script.getFileSystemURL(scriptId)
    };
  });
  
} catch(e) {
  /** ignore error when running with metro bundler */
}