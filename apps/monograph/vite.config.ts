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
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import arraybuffer from "vite-plugin-arraybuffer";
import wasm from "vite-plugin-wasm";
import { IS_CLOUDFLARE } from "./app/utils/is-cloudflare";

export default defineConfig({
  plugins: [
    IS_CLOUDFLARE ? remixCloudflareDevProxy() : null,
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true
      }
    }),
    tsconfigPaths(),
    arraybuffer(),
    wasm()
  ],
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  build: {
    rollupOptions: {
      external: ["svg2png-wasm/svg2png_wasm_bg.wasm"]
    }
  },
  define: {
    PUBLIC_URL: JSON.stringify(
      process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5017}`
    )
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@mdi/js",
      "@mdi/react",
      "@emotion/react",
      "zustand",
      "@theme-ui/core",
      "@theme-ui/components"
    ]
  }
});
