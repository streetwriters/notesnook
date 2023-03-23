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

function visibilityChange() {
  return "msHidden" in document
    ? "msvisibilityChange"
    : "webkitHidden" in document
    ? "webkitvisibilityChange"
    : "visibilityChange";
}

function isDocumentHidden() {
  return "msHidden" in document && typeof document.msHidden === "boolean"
    ? document.msHidden
    : "webkitHidden" in document && typeof document.webkitHidden === "boolean"
    ? document.webkitHidden
    : document.hidden;
}

export function onPageVisibilityChanged(
  handler: (
    status: "online" | "offline" | "visibilitychange",
    bool: boolean
  ) => void
) {
  onDeviceOnline(() => handler("online", false));
  onDeviceOffline(() => handler("offline", false));

  // Handle page visibility change
  document.addEventListener(visibilityChange(), () =>
    handler("visibilitychange", isDocumentHidden())
  );
}

function onDeviceOnline(handler: () => void) {
  window.addEventListener("online", function () {
    handler();
  });
}

function onDeviceOffline(handler: () => void) {
  window.addEventListener("offline", function () {
    handler();
  });
}
