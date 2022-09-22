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
    title: "Auto sync for all",
    body: "We have enabled automatic sync for all users in this update. No need to run sync manually."
  },
  {
    title: "Realtime sync updates",
    body: "As soon as new changes arrive, any note opened in the editor will update automatically while maintaining cursor position."
  },
  {
    title: "Quick actions & shortcuts",
    body: "Long press on app icon to see shortcuts and quick actions. Currently we have added support for opening the editor for creating a new note from launcher."
  },
  {
    title: "Splashscreen follows system theme",
    body: "Previously the app would always show a white splashscreen on launch which was very uncomfortable for eyes at night. Splashscreen will follow system theme now."
  }
];
