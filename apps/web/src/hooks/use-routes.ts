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

import { useLocation } from "wouter";
import makeMatcher from "wouter/matcher";
import { navigate, getHomeRoute } from "../navigation";
import { Params, RouteResult, Routes } from "../navigation/types";
import { useEffect, useState } from "react";

export default function useRoutes<T extends string>(
  routes: Routes<T>,
  options?: {
    hooks?: { beforeNavigate: (location: string) => boolean };
    fallbackRoute?: string;
  }
) {
  const [location] = useLocation();
  const [result, setResult] = useState<RouteResult>();

  useEffect(() => {
    (async function () {
      const matcher = makeMatcher();

      if (
        options?.hooks?.beforeNavigate &&
        !options?.hooks?.beforeNavigate(location)
      )
        return;

      for (const key in routes) {
        const [match, params] = matcher(key, location);
        if (match) {
          const result = await routes[key](
            (params as Params<typeof key>) || {}
          );
          if (!result) break;
          setResult(result);
          return;
        }
      }

      if (!options) return;
      const { fallbackRoute } = options;
      if (fallbackRoute) {
        navigate(fallbackRoute);
      }
    })();
  }, [location]);

  return result ? ([result, location] as const) : [];
}
