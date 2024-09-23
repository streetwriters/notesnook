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

import { useEffect, useRef, useState } from "react";

export function useTimer(duration: number) {
  const [enabled, setEnabled] = useState(false);
  const timeout = useRef<number>();

  const cancelTimeout = () => {
    setEnabled(false);
    clearTimeout(timeout.current);
  };

  const start = () => {
    cancelTimeout();
    setEnabled(true);

    timeout.current = setTimeout(() => {
      cancelTimeout();
    }, duration) as unknown as number;
  };

  useEffect(() => {
    return cancelTimeout;
  }, []);

  return { enabled, start };
}
