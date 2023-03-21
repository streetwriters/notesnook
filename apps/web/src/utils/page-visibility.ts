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

let hidden: string, visibilityChange: string;
if (typeof document.hidden !== "undefined") {
  // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof (document as any).msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof (document as any).webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

export function onPageVisibilityChanged(
  handler: (status: string, current: boolean) => void
) {
  onDeviceOnline(() => handler("online", false));
  onDeviceOffline(() => handler("offline", false));

  // Handle page visibility change
  document.addEventListener(visibilityChange, () =>
    handler("visibilitychange", (document as any)[hidden])
  );
}

function onDeviceOnline(handler: () => void | undefined) {
  window.addEventListener("online", function () {
    handler && handler();
  });
}

function onDeviceOffline(handler: () => void | undefined) {
  window.addEventListener("offline", function () {
    handler && handler();
  });
}
