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
import { useRef, useState } from "react";
import { MMKV } from "../common/database/mmkv";

export function useStoredValue<T>(
  key: string,
  initialValue: T
): { value: T; reset(): void } {
  const refKey = `storedState:${key}`;
  const [value, setValue] = useState<T>(
    MMKV.getMap<{ value: T }>(refKey)?.value || initialValue
  );
  const frameRef = useRef(0);

  return {
    get value() {
      return value;
    },
    set value(next: T) {
      setValue(next);
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        MMKV.setMap(refKey, {
          value: value
        });
      });
    },
    reset() {
      MMKV.removeItem(refKey);
    }
  };
}
