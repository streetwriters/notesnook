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

import { init } from "@notesnook/web/src/bootstrap";
import { render } from "react-dom";
import ThemeBuilder from "./components/theme-builder";
import { BaseThemeProvider } from "@notesnook/web/src/components/theme-provider";

renderApp();

async function renderApp() {
  const { component, props, path } = await init();

  const { default: Component } = await component();
  render(
    <BaseThemeProvider
      addGlobalStyles
      sx={{
        display: "flex",
        "#app": { flex: 1, height: "unset" },
        height: path === "default" ? "100%" : "unset"
      }}
    >
      <Component route={props?.route || "login:email"} />
      <ThemeBuilder />
    </BaseThemeProvider>,
    document.getElementById("root"),
    () => {
      document.getElementById("splash")?.remove();
    }
  );
}
