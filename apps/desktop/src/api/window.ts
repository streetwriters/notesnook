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

      // We need to handle the route mapping similar to createURL in main/window-manager
      // For now, let's pass a custom path or parameters.
      // The WindowManager.createWindow accepts a path.
      // Let's update createURL logic in our head: it takes a path.

      // If we pass a full hash path like "#/notes/id", the URL constructor might handle it if we pass it as part of the base?
      // No, createURL takes a path argument.

      // Let's change the input to be more flexible.
      // Let's change the input to be more flexible.
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
