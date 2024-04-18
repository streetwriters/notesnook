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

import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";

const t = initTRPC.create();

export const windowRouter = t.router({
  maximize: t.procedure.mutation(() => {
    globalThis.window?.maximize();
  }),
  restore: t.procedure.mutation(() => {
    globalThis.window?.restore();
  }),
  minimze: t.procedure.mutation(() => {
    globalThis.window?.minimize();
  }),
  maximized: t.procedure.query(() => globalThis.window?.isMaximized()),
  fullscreen: t.procedure.query(() => globalThis.window?.isFullScreen()),
  onWindowStateChanged: t.procedure.subscription(() => {
    return observable<{ maximized: boolean; fullscreen: boolean }>((emit) => {
      function listener() {
        emit.next({
          maximized: !!globalThis.window?.isMaximized(),
          fullscreen: !!globalThis.window?.isFullScreen()
        });
      }
      function enterFullscreen() {
        emit.next({
          maximized: !!globalThis.window?.isMaximized(),
          fullscreen: true
        });
      }
      function leaveFullscreen() {
        emit.next({
          maximized: !!globalThis.window?.isMaximized(),
          fullscreen: false
        });
      }
      globalThis.window?.addListener("maximize", listener);
      globalThis.window?.addListener("minimize", listener);
      globalThis.window?.addListener("unmaximize", listener);
      globalThis.window?.addListener("restore", listener);
      globalThis.window?.addListener("enter-full-screen", enterFullscreen);
      globalThis.window?.addListener("leave-full-screen", leaveFullscreen);
      globalThis.window?.addListener("leave-html-full-screen", leaveFullscreen);
      globalThis.window?.addListener("enter-html-full-screen", enterFullscreen);
      return () => {
        globalThis.window?.removeListener("maximize", listener);
        globalThis.window?.removeListener("minimize", listener);
        globalThis.window?.removeListener("unmaximize", listener);
        globalThis.window?.removeListener("restore", listener);
        globalThis.window?.removeListener("enter-full-screen", enterFullscreen);
        globalThis.window?.removeListener("leave-full-screen", leaveFullscreen);
        globalThis.window?.removeListener(
          "leave-html-full-screen",
          leaveFullscreen
        );
        globalThis.window?.removeListener(
          "enter-html-full-screen",
          enterFullscreen
        );
      };
    });
  })
});
