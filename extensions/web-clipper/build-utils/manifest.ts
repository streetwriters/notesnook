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
import packageJson from "../package.json";

const { version } = packageJson;

const ICONS = {
  "16": "assets/16x16.png",
  "32": "assets/32x32.png",
  "48": "assets/48x48.png",
  "64": "assets/64x64.png",
  "128": "assets/128x128.png",
  "256": "assets/256x256.png"
};
const ACTION = {
  default_icon: ICONS,
  default_title: "Notesnook Web Clipper",
  default_popup: "index.html"
};

const nnHost =
  process.env.NODE_ENV === "production"
    ? "*://app.notesnook.com/*"
    : "*://localhost/*";
const corsHost = "https://cors.notesnook.com/*";
const common = {
  name: "Notesnook Web Clipper",
  version,
  description:
    "Clip web pages & save interesting things you find on the web directly into Notesnook in a private & secure way.",
  permissions: ["activeTab", "tabs", "storage", "notifications"],
  icons: ICONS
};

const v2 = {
  ...common,
  permissions: [...common.permissions, corsHost, nnHost],
  optional_permissions: ["http://*/*", "https://*/*"],
  browser_specific_settings: {
    gecko: {
      id: "notesnook-web-clipper-unlisted@notesnook.com",
      strict_min_version: "105.0"
    }
  },
  manifest_version: 2,
  background: {
    scripts: ["src/background.ts"]
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-scripts/all.ts"],
      run_at: "document_end"
    }
  ],
  browser_action: ACTION
};

const v3 = {
  ...common,
  permissions: [...common.permissions, "scripting"],
  host_permissions: [corsHost, nnHost],
  optional_host_permissions: ["http://*/*", "https://*/*"],
  manifest_version: 3,
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-scripts/all.ts"]
    }
  ],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  web_accessible_resources: [
    {
      resources: ["*.wasm"],
      matches: ["<all_urls>"]
    }
  ],
  action: ACTION
};

export function getManifest(version: string) {
  return version === "2" ? v2 : v3;
}

export { v2, v3 };
