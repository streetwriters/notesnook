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

import "./polyfills";
import "./app.css";
import { AppEventManager, AppEvents } from "./common/app-events";
import { register } from "./service-worker-registration";
import { getServiceWorkerVersion } from "./utils/version";
import { register as registerStreamSaver } from "./utils/stream-saver/mitm";
import { ThemeDark, ThemeLight, themeToCSS } from "@notesnook/theme";
import Config from "./utils/config";
import { setI18nGlobal, AVAILABLE_LANGUAGES, getSupportedLocale } from "@notesnook/intl";
import { i18n, type Messages } from "@lingui/core";

const colorScheme = JSON.parse(
  window.localStorage.getItem("colorScheme") || '"light"'
);
const root = document.querySelector("html");
if (root) root.setAttribute("data-theme", colorScheme);

const theme =
  colorScheme === "dark"
    ? Config.get("theme:dark", ThemeDark)
    : Config.get("theme:light", ThemeLight);
const stylesheet = document.getElementById("theme-colors");
if (theme) {
  const css = themeToCSS(theme);
  if (stylesheet) stylesheet.innerHTML = css;
} else stylesheet?.remove();

const localeMap: Record<
  string,
  () => Promise<{ default: { messages: unknown } }>
> = {
  en: () => import("@notesnook/intl/locales/$en.json"),
  fr: () => import("@notesnook/intl/locales/$fr.json"),
  es: () => import("@notesnook/intl/locales/$es.json"),
  de: () => import("@notesnook/intl/locales/$de.json"),
  it: () => import("@notesnook/intl/locales/$it.json")
};

const savedLanguage = Config.get<string | undefined>("appLanguage", undefined);
let targetLang = "en";
if (
  savedLanguage &&
  AVAILABLE_LANGUAGES.some((l) => l.code === savedLanguage)
) {
  targetLang = savedLanguage;
} else {
  let systemLocale = "en";
  try {
    systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  } catch (e) {}
  targetLang = getSupportedLocale(systemLocale);
}

const getLocaleMessages = async (lang: string) => {
  const loader = localeMap[lang] || localeMap.en;
  const mod = await loader();
  return mod.default.messages as unknown as Messages;
};

Promise.all([
  getLocaleMessages(targetLang),
  targetLang !== "en" ? getLocaleMessages("en") : Promise.resolve(null)
]).then(([targetMessages, enMessages]) => {
  const catalogs: Record<string, Messages> = {
    [targetLang]: targetMessages
  };
  if (enMessages) {
    catalogs.en = enMessages;
  }

  i18n.load(catalogs);
  i18n.activate(targetLang);

  performance.mark("import:root");
  import("./root").then(({ startApp }) => {
    performance.mark("start:app");
    startApp();
  });
});
setI18nGlobal(i18n);

if (!IS_DESKTOP_APP) {
  //   logger.info("Initializing service worker...");

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  register({
    onUpdate: async (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting) return;
      const { formatted } = await getServiceWorkerVersion(registration.waiting);
      AppEventManager.publish(AppEvents.updateDownloadCompleted, {
        version: formatted
      });
    },
    onSuccess() {
      registerStreamSaver();
    }
  });

  // window.addEventListener("beforeinstallprompt", () => showInstallNotice());
}
