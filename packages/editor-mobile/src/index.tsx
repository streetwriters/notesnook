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
global.Buffer = require("buffer").Buffer;
import { i18n } from "@lingui/core";
import "@notesnook/editor/styles/fonts.mobile.css";
import "@notesnook/editor/styles/katex-fonts.mobile.css";
import "@notesnook/editor/styles/katex.min.css";
import "@notesnook/editor/styles/styles.css";
import { $en, setI18nGlobal } from "@notesnook/intl";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

i18n.load({
  en: $en,
  ...globalThis.LINGUI_LOCALE_DATA
});
i18n.activate(globalThis.LINGUI_LOCALE || "en");
setI18nGlobal(i18n);

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
