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
    title: "Bi-directional note linking",
    body: "Now you can link notes to each other in both directions."
  },
  {
    title: "Tabs",
    body: "Tabs allow you to have multiple notes open at the same time. You can switch between them easily."
  },
  {
    title: "Nested notebooks",
    body: "You can now create notebooks inside other notebooks."
  },
  {
    title: "At-rest encryption",
    body: "Your notes are now encrypted when stored on the device."
  },
  {
    title: "Material You themed icon",
    body: "The app now has a Material You themed icon that changes color based on the wallpaper.",
    platform: "android"
  },
  {
    title: "New note quick settings tile",
    body: "You can now add a new note tile to quickly create notes from quick settings panel.",
    platform: "android"
  },
  {
    title: "And so much more...",
    body: "V3 packs so much that it's hard to put everything here, check out our blog at Notesnook V3 is here, and it's packed with new features and improvements such as bi-directional note linking, better syncing, at-rest encryption, nested notebooks, editor tabs, better app lock and so much more. https://blog.notesnook.com/introducing-notesnook-v3."
  }
];
