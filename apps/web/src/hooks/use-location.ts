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

import { useState, useEffect } from "react";
import { getCurrentPath, NavigationEvents } from "../navigation";

export default function useLocation() {
  const [location, setLocation] = useState(getCurrentPath());
  const [previousLocation, setPreviousLocation] = useState<string>();
  const [navigationState, setNavigationState] =
    useState<NavigationStates>("neutral");

  useEffect(() => {
    const navigateEvent = NavigationEvents.subscribe(
      "onNavigate",
      (_: any, currentLocation: string) => {
        setLocation((prev) => {
          setNavigationState(getNavigationState(currentLocation, prev));
          setPreviousLocation(prev);
          return currentLocation;
        });
      }
    );
    return () => {
      navigateEvent.unsubscribe();
    };
  }, []);
  return [location, previousLocation, navigationState] as const;
}

type NavigationStates = "forward" | "backward" | "same" | "neutral";
function getNavigationState(
  currentLocation: string,
  previousLocation: string
): NavigationStates {
  if (!previousLocation || !currentLocation) return "neutral";

  const currentLevels = currentLocation.split("/");
  const previousLevels = previousLocation.split("/");
  const isSameRoot = currentLevels[1] === previousLevels[1];
  return isSameRoot
    ? currentLevels.length > previousLevels.length
      ? "forward"
      : currentLevels.length < previousLevels.length
      ? "backward"
      : "same"
    : "neutral";
}
