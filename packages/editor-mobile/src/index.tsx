/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import "./utils/index";
import "./utils/commands";
global.Buffer = require("buffer").Buffer;
import { i18n } from "@lingui/core";
import "@notesnook/editor/styles/fonts.mobile.css";
import "@notesnook/editor/styles/katex-fonts.mobile.css";
import "@notesnook/editor/styles/katex.min.css";
import "@notesnook/editor/styles/styles.css";
import { setI18nGlobal } from "@notesnook/intl";
import { createRoot } from "react-dom/client";
import "./index.css";

setTimeout(() => {
  if (globalThis.__DEV__) {
    const logFn = global.console.log;
    global.console.log = function () {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      // eslint-disable-next-line prefer-rest-params
      logFn.apply(console, arguments);
      // eslint-disable-next-line prefer-rest-params
      globalThis.logger("info", ...arguments);
    };
  }
}, 100);
let appLoaded = false;
function loadApp() {
  if (appLoaded) return;
  appLoaded = true;
  const locale = globalThis.LINGUI_LOCALE_DATA
    ? Promise.resolve(globalThis.LINGUI_LOCALE_DATA)
    : globalThis.__DEV__ || process.env.NODE_ENV === "development"
    ? import("@notesnook/intl/locales/$pseudo-LOCALE.json").then(
        ({ default: locale }) => ({ en: locale.messages })
      )
    : import("@notesnook/intl/locales/$en.json").then(
        ({ default: locale }) => ({
          en: locale.messages
        })
      );

  locale.then(async (locale: { [name: string]: any }) => {
    i18n.load(locale);
    i18n.activate(globalThis.LINGUI_LOCALE || "en");
    //@ts-ignore
    setI18nGlobal(i18n);

    const rootElement = document.getElementById("root");
    if (rootElement) {
      const root = createRoot(rootElement);
      const App = require("./App").default;
      root.render(<App />);
    }
  });
}
globalThis.loadApp = loadApp;

if (process.env.NODE_ENV === "development") {
  loadApp();
}
