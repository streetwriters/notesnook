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
        create: z.boolean().optional(),
        // When true the new window is created as a "single note" window: it
        // is pinned to the given note (or a new note when `create` is true),
        // uses a single-group layout and closes when its last tab is closed.
        // When false (the default for tear-out) the new window is a regular
        // multi-tab window that happens to start with the requested note open
        // as its first tab — so subsequent notes opened from the list create
        // visible tabs instead of replacing the current tab's session.
        singleNote: z.boolean().optional()
      })
    )
    .mutation(({ input }) => {
      // Resolve the hash route to load in the new window. When a note is
      // requested we navigate to the note editor route so the renderer opens
      // that note; for `create` we navigate to the create-note route. The
      // routePath is passed to createWindow and used as url.hash below.
      let routePath = input.path || "/";
      if (!input.path) {
        if (input.noteId) routePath = `/notes/${input.noteId}/edit`;
        else if (input.create) routePath = "/notes/create/1";
      }

      const singleNote = input.singleNote === true;

      windowManager.createWindow(
        {},
        {
          // `note` stays false for the multi-tab case so that createURL does
          // not force singleNote semantics. The actual note (if any) is
          // opened via the hash route handled by hash-routes.tsx.
          note: singleNote ? input.noteId || input.create || false : false,
          notebook: false,
          reminder: false,
          hidden: false,
          singleNote
        },
        routePath
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
  }),
  startDragSession: t.procedure
    .input(
      z.object({
        title: z.string(),
        colors: z
          .object({ bg: z.string(), fg: z.string(), border: z.string() })
          .optional()
      })
    )
    .mutation(({ input }) => {
      windowManager.startDragSession(input.title, input.colors);
    }),
  endDragSession: t.procedure.mutation(() => {
    windowManager.endDragSession();
  }),
  checkInternalDrop: t.procedure
    .input(
      z.object({
        x: z.number(),
        y: z.number(),
        type: z.enum(["tab", "note"]),
        id: z.string()
      })
    )
    .mutation(({ input, ctx }) => {
      return windowManager.handleExternalDrop(input, ctx.window.id);
    }),
  // Broadcast a note change to all other windows so they can sync content.
  // Called when a note is saved in one window; other windows with the same
  // note open will reload the content from the shared SQLite DB.
  notifyNoteChanged: t.procedure
    .input(z.object({ noteId: z.string() }))
    .mutation(({ input, ctx }) => {
      windowManager.broadcastToWindows("app:note-changed", input, ctx.window.id);
    }),

  // List all *other* app windows (excluding the calling window). Used to
  // populate the "Move tab to window" submenu in the tab context menu. The
  // sessionId is the stable windowSessionId used by the renderer to key its
  // persisted editor state, and title is the window's current document title
  // (or a fallback) so the user can tell windows apart.
  list: t.procedure.query(({ ctx }) => {
    return windowManager.listOtherWindows(ctx.window.id);
  }),

  // Move a tab (identified by its noteId + tabId in the source window) to
  // another window. When targetSessionId is omitted a brand-new window is
  // created with the note opened as its first tab. The source window is then
  // told to close the tab via the `app:close-tab` IPC channel.
  moveTab: t.procedure
    .input(
      z.object({
        noteId: z.string(),
        tabId: z.string(),
        targetSessionId: z.string().optional()
      })
    )
    .mutation(({ input, ctx }) => {
      const handled = windowManager.moveTabToWindow(
        input.noteId,
        input.targetSessionId,
        ctx.window.id
      );

      // Always tell the source window to close the moved tab so the user
      // sees the tab disappear from the source window. We send this even when
      // a new window is created (handled === false means a new window was
      // opened rather than dropped onto an existing one).
      ctx.window.webContents.send("app:close-tab", { tabId: input.tabId });
      return { handled };
    })
});
