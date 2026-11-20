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

import { SettingsGroup } from "./types";
import { Importer, importerStore } from "../../components/importer";
import { SquaresFour } from "../../components/icons";
import { strings } from "@notesnook/intl";
import { ProviderFactory, Providers } from "@notesnook-importer/core";

export const ImporterSettings: SettingsGroup[] = [
  {
    key: "importer",
    section: "importer",
    get header() {
      return strings.notesnookImporter();
    },
    onRender: () => importerStore.reset(),
    settings: [
      {
        key: "select-notes-app",
        icon: SquaresFour,
        get title() {
          return strings.selectNotesAppToImportFrom();
        },
        get description() {
          return `${strings.cantFindNotesApp()} [${strings.sendUsARequest()}](https://github.com/streetwriters/notesnook-importer/issues/new)`;
        },
        keywords: ["import", "importer", "notes app", "provider"],
        onStateChange: (listener) =>
          importerStore.subscribe(() =>
            listener(importerStore.getState(), undefined)
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "", title: strings.selectNotesApp() },
              ...ProviderFactory.getAvailableProviders().map((provider) => ({
                value: provider as string,
                title: ProviderFactory.getProvider(provider as Providers).name
              }))
            ],
            selectedOption: () => importerStore.getState().providerId || "",
            onSelectionChanged: (value) => {
              if (!value) return;
              importerStore.selectProvider(value as Providers);
            }
          }
        ]
      }
    ]
  },
  {
    key: "importer-steps",
    section: "importer",
    header: Importer,
    settings: []
  }
];
