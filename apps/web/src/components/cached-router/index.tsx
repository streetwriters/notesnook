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

import React, { useEffect, useRef } from "react";
import { getHomeRoute, NavigationEvents } from "../../navigation";
import { store as selectionStore } from "../../stores/selection-store";
import useRoutes from "../../hooks/use-routes";
import RouteContainer from "../route-container";
import routes from "../../navigation/routes";
import { isRouteResult } from "../../navigation/types";
import { Freeze } from "react-freeze";
import { Flex } from "@theme-ui/components";

function CachedRouter() {
  const [RouteResult, location] = useRoutes(routes, {
    fallbackRoute: getHomeRoute(),
    hooks: {
      beforeNavigate: () => selectionStore.toggleSelectionMode(false)
    }
  });
  const cachedRoutes = useRef<Record<string, React.FunctionComponent>>({});

  useEffect(() => {
    if (!RouteResult) return;
    NavigationEvents.publish("onNavigate", RouteResult, location);
  }, [RouteResult, location]);

  if (!RouteResult || !isRouteResult(RouteResult)) return null;
  if (RouteResult.key === "general" || !cachedRoutes.current[RouteResult.key])
    cachedRoutes.current[RouteResult.key] =
      RouteResult.component as React.FunctionComponent;

  return (
    <RouteContainer
      type={RouteResult.type}
      title={RouteResult.title}
      buttons={RouteResult.buttons}
    >
      {Object.entries(cachedRoutes.current).map(([key, Component]) => (
        <Freeze key={key} freeze={key !== RouteResult.key}>
          <Flex
            id={key}
            key={key}
            sx={{
              flexDirection: "column",
              flex: 1,
              overflow: "hidden"
            }}
          >
            <Component key={key} {...RouteResult.props} />
          </Flex>
        </Freeze>
      ))}
    </RouteContainer>
  );
}

export default React.memo(CachedRouter, () => true);
