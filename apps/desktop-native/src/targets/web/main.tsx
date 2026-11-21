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
import "@formatjs/intl-locale/polyfill-force";
import "@formatjs/intl-pluralrules/polyfill-force";
import "@formatjs/intl-pluralrules/locale-data/en";
import "./platform";
import { createRoot } from "react-dom/client";
import { initLocaleSync } from "../../app/common/locale";

async function start() {
  if (new URLSearchParams(location.search).get("page") === "primitives") {
    const { PrimitivesTestPage } = await import("./primitives-test-page");
    createRoot(document.getElementById("root")!).render(
      <PrimitivesTestPage />
    );
    return;
  }
  initLocaleSync();
  const [{ THEME_DARK, THEME_LIGHT }, { Root }, themeStore, ui] =
    await Promise.all([
      import("../../app/common/theme"),
      import("../../app/root"),
      import("../../app/stores/theme-store"),
      import("./ui")
    ]);
  const { LayoutRoot, WebThemeProvider } = ui;

  function App() {
    const colorScheme = themeStore.useStore((store) => store.colorScheme);
    return (
      <LayoutRoot>
        <WebThemeProvider
          theme={colorScheme === "dark" ? THEME_DARK : THEME_LIGHT}
        >
          <Root
            colorScheme={colorScheme}
            onToggleColorScheme={() =>
              themeStore.useStore.setState({
                colorScheme: colorScheme === "dark" ? "light" : "dark"
              })
            }
          />
        </WebThemeProvider>
      </LayoutRoot>
    );
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

start();
