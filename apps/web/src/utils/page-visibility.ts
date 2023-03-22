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

const getVisibilityChangeParams = () => {
  if ("hidden" in document) {
    // Opera 12.10 and Firefox 18 and later support
    return ["hidden", "visibilityChange"] as const;
  } else if ("msHidden" in document) {
    return ["msHidden", "msvisibilityChange"] as const;
  } else if ("webkitHidden" in document) {
    return ["webkitHidden", "webkitvisibilityChange"] as const;
  }
  return ["hidden", "visibilityChange"] as const;
};

export function onPageVisibilityChanged(
  handler: (
    status: "online" | "offline" | "visibilitychange",
    bool: boolean
  ) => void
) {
  onDeviceOnline(() => handler("online", false));
  onDeviceOffline(() => handler("offline", false));

  // Handle page visibility change
  const { hidden, visibilityChange } = getVisibilityChangeParams();
  document.addEventListener(visibilityChange, () =>
    handler("visibilitychange", (document as any)[hidden])
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
