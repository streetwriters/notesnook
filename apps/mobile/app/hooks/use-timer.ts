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

const timers: { [name: string]: number } = {};

function getSecondsLeft(id?: string) {
  const endTime = timers[id || ""];
  if (!endTime) return 0;
  if (endTime < Date.now()) return 0;
  return ((endTime - Date.now()) / 1000).toFixed(0);
}

const useTimer = (initialId?: string) => {
  const [id, setId] = useState(initialId);
  const [seconds, setSeconds] = useState(getSecondsLeft(id));
  const interval = useRef<NodeJS.Timer>();

  const start = (sec: number, currentId = id) => {
    if (!currentId) return;
    timers[currentId] = Date.now() + sec * 1000;

    setSeconds(getSecondsLeft(id));
  };

  useEffect(() => {
    interval.current = setInterval(() => {
      const timeLeft = getSecondsLeft(id);
      setSeconds(timeLeft);
      if (timeLeft === 0) interval.current && clearInterval(interval.current);
    }, 1000);

    return () => {
      interval.current && clearInterval(interval.current);
    };
  }, [seconds, id]);

  return { seconds, setId, start };
};

export default useTimer;
