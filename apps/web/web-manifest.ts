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

import { ManifestOptions } from "vite-plugin-pwa";

export const WEB_MANIFEST: Partial<ManifestOptions> = {
  name: "Notesnook",
  description:
    "A fully open source & end-to-end encrypted note taking alternative to Evernote.",
  short_name: "Notesnook",
  shortcuts: [
    {
      name: "New note",
      url: "/#/notes/create",
      description: "Create a new note",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    },
    {
      name: "New notebook",
      url: "/#/notebooks/create",
      description: "Create a new notebook",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    }
  ],
  icons: [
    {
      src: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png"
    },
    {
      src: "/android-chrome-maskable-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/android-chrome-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ],
  screenshots: [
    {
      src: "/screenshots/screenshot-1.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    },
    {
      src: "/screenshots/screenshot-2.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    },
    {
      src: "/screenshots/screenshot-3.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    },
    {
      src: "/screenshots/screenshot-4.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    },
    {
      src: "/screenshots/screenshot-5.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    },
    {
      src: "/screenshots/screenshot-6.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    },
    {
      src: "/screenshots/screenshot-7.jpg",
      sizes: "1080x1920",
      type: "image/jpeg"
    }
  ],
  related_applications: [
    {
      platform: "play",
      url: "https://play.google.com/store/apps/details?id=com.streetwriters.notesnook",
      id: "com.streetwriters.notesnook"
    },
    {
      platform: "itunes",
      url: "https://apps.apple.com/us/app/notesnook-private-notes-app/id1544027013"
    }
  ],
  prefer_related_applications: true,
  orientation: "any",
  start_url: ".",
  theme_color: "#01c352",
  background_color: "#ffffff",
  display: "standalone",
  categories: ["productivity", "lifestyle", "education", "books"]
};
