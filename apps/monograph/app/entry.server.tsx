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
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { createEmotionCache } from "./styles/createEmotionCache";
import { Head } from "./root";
import { ThemeDark } from "@notesnook/theme";

globalThis.DEFAULT_THEME = ThemeDark;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // swap out default component with <Head>
  const defaultRoot = remixContext.routeModules.root;
  remixContext.routeModules.root = {
    ...defaultRoot,
    default: Head
  };

  const head = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  // restore the default root component
  remixContext.routeModules.root = defaultRoot;

  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  const body = renderToString(
    <CacheProvider value={cache}>
      <RemixServer context={remixContext} url={request.url} />
    </CacheProvider>
  );

  const styles = constructStyleTagsFromChunks(extractCriticalToChunks(body));
  const html = `<!DOCTYPE html><html><head><!--start head-->${head}${styles}<!--end head--></head><body><div id="root">${body}</div></body></html>`;

  responseHeaders.set("Content-Type", "text/html; charset=utf-8");

  return new Response(html, {
    status: responseStatusCode,
    headers: responseHeaders
  });
}
