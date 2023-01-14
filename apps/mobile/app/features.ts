/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
    title: "Cross platform Reminders 🔔",
    body: "Finally reminders are here. You can set reminders on notes or independently. Go to Side Menu > Reminders to set your first reminder!"
  },
  {
    title: "Multi-factor auth by default",
    body: "Multi-factor auth is enabled by default for all users to improve login security."
  },
  {
    title: "Change account email",
    body: "Now you can go to Settings > Account Settings to change your email."
  },
  {
    title: "Sync settings",
    body: "Added options to disable sync, auto-sync & real-time sync from settings."
  },
  {
    title: "Improved PDF exports styling",
    body: "Tables, checklists, codeblocks, quotes are now properly formatted in PDF exports."
  }
];
