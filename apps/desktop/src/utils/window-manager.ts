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

/*
ABOUTME: This file implements the DragManager class (formerly WindowManager).
It handles custom drag-and-drop sessions with visual feedback (ghost window).
*/

import { BrowserWindow, screen } from "electron";
import { getTheme } from "./theme";

/**
 * DragManager handles custom drag-and-drop sessions with visual feedback.
 * It creates a lightweight transparent window that follows the cursor during drag operations.
 */
export class DragManager {
  private dragWindow: BrowserWindow | null = null;
  private dragInterval: NodeJS.Timeout | null = null;

  constructor() {}

  /**
   * Starts a custom drag session by creating a small, transparent window that follows the cursor.
   * Used to provide visual feedback during drag operations (e.g. dragging a note).
   *
   * @param title - The text to display in the drag preview.
   * @param colors - Color theme for the drag preview (background, foreground, border).
   */
  startDragSession(
    title: string,
    colors: { bg: string; fg: string; border: string } = {
      bg: getTheme() === "dark" ? "#333" : "#fff",
      fg: getTheme() === "dark" ? "#fff" : "#000",
      border: getTheme() === "dark" ? "#555" : "#ccc"
    }
  ) {
    if (this.dragWindow) {
      this.endDragSession();
    }

    const cursor = screen.getCursorScreenPoint();
    const width = 200;
    const height = 45;

    this.dragWindow = new BrowserWindow({
      x: Math.round(cursor.x - width / 2),
      y: Math.round(cursor.y - height / 2),
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.dragWindow.on("ready-to-show", () => {
      this.dragWindow?.showInactive();
    });

    this.dragWindow.setAlwaysOnTop(true, "screen-saver");

    const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `
      <html>
        <body style="background: transparent; margin: 0; padding: 4px; height: 100vh; display: flex; align-items: center; box-sizing: border-box; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="
            background: ${colors.bg};
            color: ${colors.fg};
            border: 1px solid ${colors.border || "transparent"};
            border-radius: 8px;
            padding: 0 12px;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            height: 36px;
            width: 100%;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          ">
            ${safeTitle}
          </div>
        </body>
      </html>
    `;

    // We use a simple data URL for the drag image
    this.dragWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    this.dragWindow.setIgnoreMouseEvents(true);

    this.dragInterval = setInterval(() => {
      if (!this.dragWindow || this.dragWindow.isDestroyed()) {
        this.endDragSession();
        return;
      }

      const point = screen.getCursorScreenPoint();
      try {
        this.dragWindow.setPosition(
          Math.round(point.x - width / 2),
          Math.round(point.y - height / 2)
        );
      } catch (e) {
        // console.error("[DragManager] Error setting position:", e);
      }

      // Check if we are over any of our app windows
      // For single window mode, checking global window existence is probably enough
      // But we just want to keep showing it until endDragSession is called.
      if (!this.dragWindow.isVisible()) {
        this.dragWindow.showInactive();
      }
    }, 16); // ~60fps
  }

  /**
   * Ends the current drag session, destroying the drag preview window and clearing the interval.
   */
  endDragSession() {
    if (this.dragInterval) {
      clearInterval(this.dragInterval);
      this.dragInterval = null;
    }

    if (this.dragWindow) {
      if (!this.dragWindow.isDestroyed()) {
        this.dragWindow.destroy();
      }
      this.dragWindow = null;
    }
  }

  /**
   * Handles drop events that occur outside the source window (external drops).
   * Determines which window triggers the drop and forwards the event to it.
   *
   * @param payload - The drop event data including coordinates and item type.
   * @param excludeWindowId - The ID of the window where the drag originated (to avoid self-drops if needed).
   * @returns Object indicating if the drop was handled.
   */
  handleExternalDrop(
    payload: {
      x: number;
      y: number;
      type: "tab" | "note";
      id: string;
    },
    excludeWindowId: number
  ) {
    const { x, y } = payload;
    const window = globalThis.window; // Main window reference
    if (window && !window.isDestroyed() && window.id !== excludeWindowId) {
      const bounds = window.getBounds();
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        // Let's send the event to that window
        window.webContents.send("app:external-drop", payload);
        return { handled: true };
      }
    }
    return { handled: false };
  }
}

export const dragManager = new DragManager();
