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
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react";
import { BaseThemeProvider } from "./components/theme-provider";
import { Buffer } from "buffer";
import { ThemeDark, themeToCSS } from "@notesnook/theme";
import { LoaderFunction } from "@remix-run/node";

globalThis.Buffer = Buffer;

type RootLoaderData = { cspScriptNonce: string };
export const loader: LoaderFunction = async () => {
  const crypto = await import("node:crypto");
  return { cspScriptNonce: crypto.randomBytes(16).toString("hex") };
};

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
        dangerouslySetInnerHTML={{ __html: themeToCSS(ThemeDark) }}
      />
    </>
  );
}

export default function App() {
  const data = useLoaderData<RootLoaderData>();
  const cspScriptNonce =
    typeof document === "undefined" ? data.cspScriptNonce : "";

  return (
    <>
      <BaseThemeProvider
        injectCssVars
        colorScheme="dark"
        sx={{ bg: "background" }}
      >
        <Outlet />
      </BaseThemeProvider>
      <ScrollRestoration nonce={cspScriptNonce} />
      <Scripts nonce={cspScriptNonce} />
    </>
  );
}
