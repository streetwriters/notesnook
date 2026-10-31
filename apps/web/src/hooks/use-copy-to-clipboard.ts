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

import { writeText } from "clipboard-polyfill";
import { useCallback, useEffect, useState } from "react";

export function useCopyToClipboard(resetAfter = 2000) {
  // a timestamp instead of a boolean so repeated copies restart the timer
  const [copiedAt, setCopiedAt] = useState<number>();

  useEffect(() => {
    if (copiedAt === undefined) return;
    const timeout = setTimeout(() => setCopiedAt(undefined), resetAfter);
    return () => clearTimeout(timeout);
  }, [copiedAt, resetAfter]);

  const copy = useCallback(async (text: string) => {
    try {
      await writeText(text);
      setCopiedAt(Date.now());
    } catch (e) {
      console.error(e);
    }
  }, []);

  return { copied: copiedAt !== undefined, copy };
}
