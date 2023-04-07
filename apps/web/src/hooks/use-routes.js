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

export default function useRoutes(routes, options) {
  const [location] = useLocation();
  const matcher = makeMatcher();

  if (location === "/") navigate(getHomeRoute());

  options?.hooks?.beforeNavigate(location);

  for (var key in routes) {
    const [match, params] = matcher(key, location);
    if (match) {
      const result = routes[key](params);
      if (!result) break;
      return [result, location];
    }
  }
  if (!options) return [];
  const { fallbackRoute } = options;
  if (fallbackRoute) {
    navigate(fallbackRoute);
  }
  return [];
}
