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

import { ReactDOM, HTMLElement } from "@notesnook/ui-kit";
import { ScopedThemeProvider } from "../components/theme-provider";
import { Lightbox } from "../components/lightbox";

/**
 * Opens the lightbox on an image, the way common/attachments does for an
 * attachment. For the e2e boot option that opens it without one.
 */
export function showLightbox(image: string) {
  const container = document.getElementById("dialogContainer");
  if (!(container instanceof HTMLElement)) return;
  ReactDOM.render(
    <ScopedThemeProvider>
      <Lightbox
        image={image}
        onClose={() => {
          ReactDOM.unmountComponentAtNode(container);
        }}
      />
    </ScopedThemeProvider>,
    container
  );
}
