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
import { getHomeRoute, NavigationEvents } from "../../navigation";
import { store as selectionStore } from "../../stores/selection-store";
import useRoutes from "../../hooks/use-routes";
import RouteContainer from "../route-container";
import routes from "../../navigation/routes";

type RenderedRoute = {
  active: boolean;
  key: string;
  component: React.Component;
};

function CachedRouter() {
  const [RouteResult, location] = useRoutes(routes, {
    fallbackRoute: getHomeRoute(),
    hooks: {
      beforeNavigate: () => selectionStore.toggleSelectionMode(false)
    }
  });
  const [renderedRoutes, setRenderedRoutes] = useState<RenderedRoute[]>([]);

  useEffect(() => {
    if (!RouteResult) return;
    NavigationEvents.publish("onNavigate", RouteResult, location);

    window.currentViewType = RouteResult.type;
    window.currentViewKey = RouteResult.key;

    const key = RouteResult.key || "general";

    setRenderedRoutes((routes) => {
      const clone = routes.slice();

      const oldIndex = clone.findIndex((route) => route.active);
      if (oldIndex > -1) {
        clone[oldIndex].active = false;
      }

      const index = clone.findIndex((route) => route.key === key);
      if (index > -1) {
        clone[index].active = true;
        if (key === "general") clone[index].component = RouteResult.component;
      } else {
        clone.push({ key, active: true, component: RouteResult.component });
      }
      return clone;
    });
  }, [location]);

  return (
    <RouteContainer
      id="mainRouteContainer"
      type={RouteResult?.type}
      title={RouteResult?.title}
      subtitle={RouteResult?.subtitle}
      buttons={RouteResult?.buttons}
      isEditable={RouteResult?.isEditable}
      onChange={RouteResult?.onChange}
    >
      {renderedRoutes.map((route) => (
        <div
          key={route.key}
          id={route.key}
          className="route"
          style={{ display: route.active ? "flex" : "none" }}
        >
          {route.component}
        </div>
      ))}
    </RouteContainer>
  );
}

export default CachedRouter;
