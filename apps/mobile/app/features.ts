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
    title: "File & image sharing",
    body: "You can now share images and files from other apps to Notesnook and sync them instantly."
  },
  {
    title: "Configurable date/time formats",
    body: "You can now change date and time format across the app from Settings > Behaviour"
  },
  {
    title: "Change default note title",
    body: "You can now change default note title for new notes using different templates like $date$, $time$ and $headline$. Go to Settings > Editor to try"
  },
  {
    title: "Default notebook/topic",
    body: "You can now set a default notebook or topic to add new notes to automatically. You can make a notebook default from properties."
  }
];
