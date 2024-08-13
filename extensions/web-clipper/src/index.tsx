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
import "../assets/16x16.png";
import "../assets/32x32.png";
import "../assets/48x48.png";
import "../assets/64x64.png";
import "../assets/128x128.png";
import "../assets/256x256.png";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./index.css";

declare let module: NodeModule & {
  hot?: { accept: () => void };
};
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if (module.hot) module.hot.accept();
