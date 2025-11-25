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
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./index.css";
import { initializeFeatureChecks } from "@notesnook/web/src/utils/feature-check";
import { initializeDatabase } from "./common/db";
import { i18n } from "@lingui/core";
import { setI18nGlobal, Messages } from "@notesnook/intl";

const locale = !import.meta.env.DEV
  ? import("@notesnook/intl/locales/$pseudo-LOCALE.json")
  : import("@notesnook/intl/locales/$en.json");
locale.then(({ default: locale }) => {
  i18n.load({
    en: locale.messages as unknown as Messages
  });
  i18n.activate("en");

  const root = createRoot(document.getElementById("root")!);
  initializeFeatureChecks().then(() =>
    initializeDatabase("db").then(() => {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    })
  );
});
setI18nGlobal(i18n);
