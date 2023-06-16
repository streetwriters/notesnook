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

import { useEffect } from "react";
import ReactDOM from "react-dom";
import { getHomeRoute, NavigationEvents } from "../../navigation";
import { store as selectionStore } from "../../stores/selection-store";
import useRoutes from "../../hooks/use-routes";
import RouteContainer from "../route-container";
import ThemeProvider from "../theme-provider";
import routes from "../../navigation/routes";

var cache = {};
function CachedRouter() {
  const [RouteResult, location] = useRoutes(routes, {
    fallbackRoute: getHomeRoute(),
    hooks: {
      beforeNavigate: () => selectionStore.toggleSelectionMode(false)
    }
  });

  useEffect(() => {
    if (!RouteResult) return;
    NavigationEvents.publish("onNavigate", RouteResult, location);
    window.currentViewType = RouteResult.type;
    window.currentViewKey = RouteResult.key;

    const key = RouteResult.key || "general";

    const routeContainer = document.getElementById("mainRouteContainer");
    routeContainer.childNodes.forEach((node) => {
      node.style.display = "none";
    });

    var route = document.getElementById(key);
    if (route) {
      route.style.display = "flex";
      if (key !== "general") return;
      else {
        route.remove();
        route = undefined;
      }
    } else {
      cache[key] = false;
    }

    if (!cache[key]) {
      if (!route) {
        cache[key] = key !== "general";
        route = document.createElement("div");
        route.id = key;
        route.className = "route";
        routeContainer.appendChild(route);
      }
      ReactDOM.render(
        <ThemeProvider>{RouteResult.component}</ThemeProvider>,
        route
      );
    }
  }, [RouteResult, location]);

  return (
    <RouteContainer
      id="mainRouteContainer"
      type={RouteResult?.type}
      title={RouteResult?.title}
      subtitle={RouteResult?.subtitle}
      buttons={RouteResult?.buttons}
      isEditable={RouteResult?.isEditable}
      onChange={RouteResult?.onChange}
    />
  );
}

export default CachedRouter;
