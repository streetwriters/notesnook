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

import { JSONStorage } from "../jsonstorage";
import { screen as _screen, BrowserWindow } from "electron";
const screen = _screen;

type WindowStateOptions = {
  storageKey: string;
  maximize: boolean;
  fullScreen: boolean;
  defaultWidth: number;
  defaultHeight: number;
};

type SerializableWindowState = {
  x: number;
  y: number;
  width: number;
  height: number;
  displayBounds?: Electron.Rectangle;
  isMaximized?: boolean;
  isFullScreen?: boolean;
};

export class WindowState {
  private readonly config: WindowStateOptions;
  private state: SerializableWindowState;
  private windowRef: BrowserWindow | undefined;
  private readonly eventHandlingDelay = 100;
  private stateChangeTimer: NodeJS.Timeout | undefined;

  constructor(options?: Partial<WindowStateOptions>) {
    this.windowRef = undefined;
    this.stateChangeTimer = undefined;
    this.config = {
      storageKey: "windowState",
      maximize: true,
      fullScreen: true,
      defaultHeight: 800,
      defaultWidth: 600,
      ...options
    };

    // Load previous state
    const defaultState: SerializableWindowState = {
      width: this.config.defaultWidth,
      height: this.config.defaultHeight,
      x: 0,
      y: 0
    };
    this.state = JSONStorage.get<SerializableWindowState>(
      this.config.storageKey,
      defaultState
    );

    // Check state validity
    this.validateState(defaultState);
  }

  isNormal(win: BrowserWindow) {
    return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
  }

  hasBounds() {
    return (
      this.state &&
      Number.isInteger(this.state.x) &&
      Number.isInteger(this.state.y) &&
      Number.isInteger(this.state.width) &&
      this.state.width > 0 &&
      Number.isInteger(this.state.height) &&
      this.state.height > 0
    );
  }

  resetStateToDefault() {
    const displayBounds = screen.getPrimaryDisplay().bounds;

    // Reset state to default values on the primary display
    this.state = {
      width: this.config.defaultWidth || 800,
      height: this.config.defaultHeight || 600,
      x: 0,
      y: 0,
      displayBounds
    };
  }

  windowWithinBounds(bounds: Electron.Rectangle) {
    if (!this.state) return false;

    return (
      this.state.x >= bounds.x &&
      this.state.y >= bounds.y &&
      this.state.x + this.state.width <= bounds.x + bounds.width &&
      this.state.y + this.state.height <= bounds.y + bounds.height
    );
  }

  ensureWindowVisibleOnSomeDisplay() {
    const visible = screen.getAllDisplays().some((display) => {
      return this.windowWithinBounds(display.bounds);
    });

    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return this.resetStateToDefault();
    }
  }

  validateState(defaultState: SerializableWindowState) {
    const isValid =
      this.state &&
      (this.hasBounds() || this.state.isMaximized || this.state.isFullScreen);
    if (!isValid) {
      this.state = defaultState;
      return;
    }

    if (this.hasBounds() && this.state.displayBounds) {
      this.ensureWindowVisibleOnSomeDisplay();
    }
  }

  updateState(win?: BrowserWindow) {
    win = win || this.windowRef;
    if (!win) {
      return;
    }
    // Don't throw an error when window was closed
    try {
      const winBounds = win.getBounds();
      if (this.isNormal(win)) {
        this.state.x = winBounds.x;
        this.state.y = winBounds.y;
        this.state.width = winBounds.width;
        this.state.height = winBounds.height;
      }
      this.state.isMaximized = win.isMaximized();
      this.state.isFullScreen = win.isFullScreen();
      this.state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
    } catch (err) {
      console.error(err);
    }
  }

  saveState(win?: BrowserWindow) {
    // Update window state only if it was provided
    if (win) {
      this.updateState(win);
    }

    // Save state
    JSONStorage.set(this.config.storageKey, this.state);
  }

  stateChangeHandler = () => {
    // Handles both 'resize' and 'move'
    if (this.stateChangeTimer) clearTimeout(this.stateChangeTimer);
    this.stateChangeTimer = setTimeout(
      () => this.updateState(),
      this.eventHandlingDelay
    );
  };

  closeHandler = () => {
    this.updateState();
  };

  closedHandler = async () => {
    // Unregister listeners and save state
    this.unmanage();

    this.saveState();
  };

  manage(win: BrowserWindow) {
    if (this.config.maximize && this.state.isMaximized) {
      win.maximize();
    }
    if (this.config.fullScreen && this.state.isFullScreen) {
      win.setFullScreen(true);
    }
    win.on("resize", this.stateChangeHandler);
    win.on("move", this.stateChangeHandler);
    win.on("close", this.closeHandler);
    win.on("closed", this.closedHandler);
    this.windowRef = win;
  }

  unmanage() {
    if (this.windowRef) {
      this.windowRef.removeListener("resize", this.stateChangeHandler);
      this.windowRef.removeListener("move", this.stateChangeHandler);
      if (this.stateChangeTimer) clearTimeout(this.stateChangeTimer);
      this.windowRef.removeListener("close", this.closeHandler);
      this.windowRef.removeListener("closed", this.closedHandler);
      this.windowRef = undefined;
    }
  }

  get x() {
    return this.state.x;
  }

  get y() {
    return this.state.y;
  }

  get width() {
    return this.state.width;
  }

  get height() {
    return this.state.height;
  }

  get displayBounds() {
    return this.state.displayBounds;
  }

  get isMaximized() {
    return this.state.isMaximized;
  }

  get isFullScreen() {
    return this.state.isFullScreen;
  }
}
