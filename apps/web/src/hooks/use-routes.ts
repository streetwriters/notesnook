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
import { Params, Routes } from "../navigation/types";

export default function useRoutes<T extends string>(
  routes: Routes<T>,
  options?: {
    hooks?: { beforeNavigate: (location: string) => void };
    fallbackRoute?: string;
  }
) {
  const [location] = useLocation();
  const matcher = makeMatcher();

  if (location === "/") navigate(getHomeRoute());

  options?.hooks?.beforeNavigate(location);

  for (const key in routes) {
    const [match, params] = matcher(key, location);
    if (match) {
      const result = routes[key]((params as Params<typeof key>) || {});
      if (!result) break;
      return [result, location] as const;
    }
  }
  if (!options) return [] as const;
  const { fallbackRoute } = options;
  if (fallbackRoute) {
    navigate(fallbackRoute);
  }
  return [] as const;
}
