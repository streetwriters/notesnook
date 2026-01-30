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
import { BrowserWindow } from "electron";
import { windowManager } from "../utils/window-manager";
import { z } from "zod";

const t = initTRPC.context<{ window: BrowserWindow }>().create();

export const windowRouter = t.router({
  open: t.procedure
    .input(
      z.object({
        noteId: z.string().optional(),
        path: z.string().optional(),
        create: z.boolean().optional()
      })
    )
    .mutation(({ input }) => {
      // Open a new window
      // verify correct path logic
      let route = "/";
      if (input.path) {
        route = input.path;
      } else if (input.noteId) {
        route = `/notes/${input.noteId}/edit`; // Adjust based on router logic
      }

      windowManager.createWindow(
        {},
        {
          note: input.noteId || input.create || false,
          notebook: false,
          reminder: false,
          hidden: false
        },
        input.path || "/"
      );
    }),
  maximize: t.procedure.mutation(({ ctx }) => {
    ctx.window.maximize();
  }),
  restore: t.procedure.mutation(({ ctx }) => {
    ctx.window.restore();
  }),
  minimze: t.procedure.mutation(({ ctx }) => {
    ctx.window.minimize();
  }),
  maximized: t.procedure.query(({ ctx }) => ctx.window.isMaximized()),
  fullscreen: t.procedure.query(({ ctx }) => ctx.window.isFullScreen()),
  onWindowStateChanged: t.procedure.subscription(({ ctx }) => {
    return observable<{ maximized: boolean; fullscreen: boolean }>((emit) => {
      const win = ctx.window;

      function listener() {
        emit.next({
          maximized: !!win?.isMaximized(),
          fullscreen: !!win?.isFullScreen()
        });
      }
      function enterFullscreen() {
        emit.next({
          maximized: !!win?.isMaximized(),
          fullscreen: true
        });
      }
      function leaveFullscreen() {
        emit.next({
          maximized: !!win?.isMaximized(),
          fullscreen: false
        });
      }
      win.addListener("maximize", listener);
      win.addListener("minimize", listener);
      win.addListener("unmaximize", listener);
      win.addListener("restore", listener);
      win.addListener("enter-full-screen", enterFullscreen);
      win.addListener("leave-full-screen", leaveFullscreen);
      win.addListener("leave-html-full-screen", leaveFullscreen);
      win.addListener("enter-html-full-screen", enterFullscreen);
      return () => {
        win.removeListener("maximize", listener);
        win.removeListener("minimize", listener);
        win.removeListener("unmaximize", listener);
        win.removeListener("restore", listener);
        win.removeListener("enter-full-screen", enterFullscreen);
        win.removeListener("leave-full-screen", leaveFullscreen);
        win.removeListener("leave-html-full-screen", leaveFullscreen);
        win.removeListener("enter-html-full-screen", enterFullscreen);
      };
    });
  })
});
