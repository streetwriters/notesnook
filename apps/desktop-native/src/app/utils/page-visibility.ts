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

export const PAGE_VISIBILITY_CHANGE = { ignore: false };
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

export function onNetworkStatusChanged(
  handler: (status: "online" | "offline") => void
) {
  const onlineListener = () => handler("online");
  const offlineListener = () => handler("online");
  window.addEventListener("online", onlineListener);
  window.addEventListener("offline", offlineListener);

  return () => {
    window.removeEventListener("online", onlineListener);
    window.removeEventListener("offline", offlineListener);
  };
}

export function onPageVisibilityChanged(
  handler: (
    status: "visibilitychange" | "focus" | "blur",
    isDocumentHidden: boolean
  ) => void
) {
  const onVisibilityChanged = () => {
    if (isEventIgnored()) return;

    handler("visibilitychange", isDocumentHidden());
  };

  const onFocus = () => {
    if (isEventIgnored()) return;

    if (!window.document.hasFocus()) return;
    handler("focus", false);
  };

  const onBlur = () => {
    if (isEventIgnored()) return;

    if (window.document.hasFocus()) return;
    handler("blur", true);
  };

  document.addEventListener(visibilityChange(), onVisibilityChanged);
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pageshow", onFocus);
  window.addEventListener("pagehide", onBlur);

  return () => {
    document.removeEventListener(visibilityChange(), onVisibilityChanged);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("pageshow", onFocus);
    window.removeEventListener("pagehide", onBlur);
  };
}

function isEventIgnored() {
  if (PAGE_VISIBILITY_CHANGE.ignore) {
    PAGE_VISIBILITY_CHANGE.ignore = false;
    return true;
  }
  return false;
}
