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
import { screen as _screen, remote } from "electron";
const screen = _screen || remote.screen;

class WindowState {
  constructor(options) {
    this.winRef = null;
    this.stateChangeTimer = undefined;
    this.eventHandlingDelay = 100;
    this.config = {
      storageKey: "windowState",
      maximize: true,
      fullScreen: true,
      ...options
    };

    // Load previous state
    this.state = JSONStorage.get(this.config.storageKey, {});

    // Check state validity
    this.validateState();

    // Set state fallback values
    this.state = {
      width: this.config.defaultWidth || 800,
      height: this.config.defaultHeight || 600,
      ...this.state
    };
  }

  isNormal(win) {
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

  windowWithinBounds(bounds) {
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

  validateState() {
    const isValid =
      this.state &&
      (this.hasBounds() || this.state.isMaximized || this.state.isFullScreen);
    if (!isValid) {
      this.state = null;
      return;
    }

    if (this.hasBounds() && this.state.displayBounds) {
      this.ensureWindowVisibleOnSomeDisplay();
    }
  }

  updateState(win) {
    win = win || this.winRef;
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

  saveState(win) {
    // Update window state only if it was provided
    if (win) {
      this.updateState(win);
    }

    // Save state
    JSONStorage.set(this.config.storageKey, this.state);
  }

  stateChangeHandler = () => {
    // Handles both 'resize' and 'move'
    clearTimeout(this.stateChangeTimer);
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

  manage(win) {
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
    this.winRef = win;
  }

  unmanage() {
    if (this.winRef) {
      this.winRef.removeListener("resize", this.stateChangeHandler);
      this.winRef.removeListener("move", this.stateChangeHandler);
      clearTimeout(this.stateChangeTimer);
      this.winRef.removeListener("close", this.closeHandler);
      this.winRef.removeListener("closed", this.closedHandler);
      this.winRef = null;
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

export { WindowState };
