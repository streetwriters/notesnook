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
import "./root.css";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";
import { BaseThemeProvider } from "./components/theme-provider";
import { Buffer } from "buffer";
import { ThemeDark, themeToCSS } from "@notesnook/theme";

globalThis.Buffer = Buffer;

export function Head() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <Meta />
      <Links />
      <style
        id="theme-colors"
        dangerouslySetInnerHTML={{ __html: colorsToCSS() }}
      />
    </>
  );
}

export default function App() {
  return (
    <>
      <BaseThemeProvider
        injectCssVars
        colorScheme="dark"
        sx={{ bg: "background" }}
      >
        <Outlet />
      </BaseThemeProvider>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

function colorsToCSS() {
  // const colorScheme = JSON.parse(
  //   window.localStorage.getItem("colorScheme") || '"light"'
  // );
  // const root = document.querySelector("html");
  // if (root) root.setAttribute("data-theme", colorScheme);

  // const theme =
  //   colorScheme === "dark"
  //     ? JSON.parse(window.localStorage.getItem("theme:dark") || "false") ||
  //       ThemeDark
  //     : JSON.parse(window.localStorage.getItem("theme:light") || "false") ||
  //       ThemeLight;
  //  const stylesheet = document.getElementById("theme-colors");
  // if (theme) {
  //   const css = ;
  //   if (stylesheet) stylesheet.innerHTML = css;
  // } else stylesheet?.remove();
  return themeToCSS(ThemeDark);
}
