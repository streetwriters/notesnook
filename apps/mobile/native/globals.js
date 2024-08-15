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
import { $en, setI18nGlobal,$de } from "@notesnook/intl";
import { i18n } from "@lingui/core";

i18n.load({
  en: $en,
  de: $de
});
i18n.activate("de");
setI18nGlobal(i18n);
