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

import type { Shell } from "../../../platform";

export const shell: Shell = {
  openUrl(url) {
    window.open(url, "_blank", "noopener");
  },
  async openPath(path) {
    window.open(path, "_blank", "noopener");
  },
  async showItemInFolder() {},
  async printHtml(title, html) {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    document.body.appendChild(frame);
    frame.srcdoc = `<title>${title}</title>${html}`;
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
    });
    frame.contentWindow?.print();
    frame.remove();
    return true;
  },
  async htmlToPdf() {
    return undefined;
  }
};
