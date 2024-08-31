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

import { FeatureType } from "./components/sheets/new-feature";

export const features: FeatureType[] = [
  {
    title: "Full offline mode",
    body: "Enable full offline mode from Settings -> Account -> Sync Settings. This will allow you to keep all your attachments and data offline on the client"
  },
  {
    title: "Backup with attachments",
    body: "You can now backup your notes alongwith all your attachments - kind of like a full account snapshot."
  },
  {
    title: "Self hosting",
    body: "This release also adds initial support for changing server URLs i.e. to connect your own instance of Notesnook. Please note that this is still experimental and may not work as expected."
  }
];
