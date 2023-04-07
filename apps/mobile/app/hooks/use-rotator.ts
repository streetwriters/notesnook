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

/**
 * A hook that can be used to rotate values in an array.
 * It will return random item in an array after given interval
 */
function useRotator<T>(data: T[], interval = 3000): T | null {
  //@ts-ignore Added sample() method to Array.prototype to get random value.
  const [current, setCurrent] = useState<T>(data.sample());
  const intervalRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      //@ts-ignore Added sample() method to Array.prototype to get random value.
      setCurrent(data.sample());
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, interval]);

  return current;
}

export default useRotator;
