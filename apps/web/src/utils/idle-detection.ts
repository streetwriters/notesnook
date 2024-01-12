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

export function startIdleDetection(ms: number, onTrigger: () => void) {
  console.log("starting idle detection", ms);
  let timeout = 0;
  function onEvent() {
    clearTimeout(timeout);
    timeout = setTimeout(onTrigger, ms) as unknown as number;
  }

  window.addEventListener("mousemove", onEvent);
  window.addEventListener("wheel", onEvent);
  window.addEventListener("keydown", onEvent);
  window.addEventListener("keydown", onEvent);
  window.addEventListener("scroll", onEvent);
  window.addEventListener("touchmove", onEvent);
  window.addEventListener("touchstart", onEvent);
  window.addEventListener("click", onEvent);
  window.addEventListener("focus", onEvent);
  window.addEventListener("blur", onEvent);

  return () => {
    clearTimeout(timeout);
    window.removeEventListener("mousemove", onEvent);
    window.removeEventListener("wheel", onEvent);
    window.removeEventListener("keydown", onEvent);
    window.removeEventListener("keydown", onEvent);
    window.removeEventListener("scroll", onEvent);
    window.removeEventListener("touchmove", onEvent);
    window.removeEventListener("touchstart", onEvent);
    window.removeEventListener("click", onEvent);
    window.removeEventListener("focus", onEvent);
    window.removeEventListener("blur", onEvent);
  };
}
