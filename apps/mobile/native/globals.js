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
import {
  messages as $en
} from "@notesnook/intl/locales/$en.json";

i18n.load({
  en: $en,
});
setI18nGlobal(i18n);
i18n.activate("en");
setI18nGlobal(i18n);
