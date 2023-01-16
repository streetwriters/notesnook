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

import { useEffect, useState } from "react";
import { initializeDatabase } from "../common/db";
import { loadTrackerScript } from "../utils/analytics";

if (process.env.NODE_ENV === "production") {
  loadTrackerScript();
  console.log = () => {};
}

const memory = {
  isAppLoaded: false
};
export default function useDatabase(persistence) {
  const [isAppLoaded, setIsAppLoaded] = useState(memory.isAppLoaded);

  useEffect(() => {
    if (memory.isAppLoaded) return;

    (async () => {
      await import("../app.css");
      await initializeDatabase(persistence);
      setIsAppLoaded(true);
      memory.isAppLoaded = true;
    })();
  }, [persistence]);

  return [isAppLoaded];
}
