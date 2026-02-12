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
import { app } from "electron";
import path from "path";

const customVersion = process.env.CUSTOM_APP_VERSION;
if (customVersion) {
  app.getVersion = () => customVersion;
  console.log("setting custom version:", customVersion);
}

if (process.env.CUSTOM_USER_DATA_DIR) {
  app.setPath(
    "appData",
    path.join(process.env.CUSTOM_USER_DATA_DIR, "AppData")
  );
  app.setPath(
    "userData",
    path.join(process.env.CUSTOM_USER_DATA_DIR, "UserData")
  );
  app.setPath(
    "documents",
    path.join(process.env.CUSTOM_USER_DATA_DIR, "Documents")
  );
}
