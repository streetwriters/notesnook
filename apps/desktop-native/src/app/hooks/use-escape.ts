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

import { useEffect, useRef } from "react";
import { keyboard } from "@platform";

const stack: Array<{ current: () => void }> = [];
let unsubscribe: (() => void) | undefined;

function attach() {
  if (unsubscribe) return;
  unsubscribe = keyboard.register(
    ["escape"],
    (event) => {
      const top = stack[stack.length - 1];
      if (!top) return;
      event.preventDefault();
      top.current();
    },
    { allowInTextInput: true }
  );
}

function detach() {
  if (stack.length > 0) return;
  unsubscribe?.();
  unsubscribe = undefined;
}

export function useEscape(handler: (() => void) | undefined, active = true) {
  const ref = useRef<() => void>(() => {});
  ref.current = () => handler?.();
  useEffect(() => {
    if (!active || !handler) return;
    stack.push(ref);
    attach();
    return () => {
      const index = stack.indexOf(ref);
      if (index >= 0) stack.splice(index, 1);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, !!handler]);
}
