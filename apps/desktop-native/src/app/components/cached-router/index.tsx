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

import { Activity, memo, useEffect, useRef, type ComponentType } from "react";
import { Flex } from "@notesnook/ui-kit";
import useRoutes from "../../hooks/use-routes";
import { getHomeRoute, navigate, NavigationEvents } from "../../navigation";
import routes from "../../navigation/routes";
import { store as selectionStore } from "../../stores/selection-store";
import { useStore as useSearchStore } from "../../stores/search-store";
import RouteContainer from "../route-container";
import { useDatabaseReady } from "../../stores/boot-store";

function CachedRouter() {
  const [routeResult, location] = useRoutes(routes, {
    fallbackRoute: getHomeRoute(),
    hooks: {
      beforeNavigate: (path) => {
        selectionStore.toggleSelectionMode(false);
        useSearchStore.getState().resetSearch();
        if (path === "/") {
          navigate(getHomeRoute(), { notify: true });
          return false;
        }
        return true;
      }
    }
  });
  const isDatabaseReady = useDatabaseReady();
  const cached = useRef<
    Record<string, { Component: ComponentType<any>; props: any }>
  >({});

  useEffect(() => {
    if (!routeResult) return;
    NavigationEvents.publish("onNavigate", routeResult, location);
  }, [routeResult, location]);

  if (!routeResult) return null;
  if (
    routeResult.key === "general" ||
    !cached.current[routeResult.key] ||
    routeResult.noCache
  )
    cached.current[routeResult.key] = {
      Component: routeResult.component as ComponentType<any>,
      props: routeResult.props
    };
  else cached.current[routeResult.key].props = routeResult.props;

  // React warns when a "key" is spread into JSX, so the route key goes by name.
  const { key: routeKey, ...routeProps } = routeResult;
  return (
    <RouteContainer {...routeProps} routeKey={routeKey}>
      {Object.entries(isDatabaseReady ? cached.current : {}).map(
        ([key, { Component, props }]) => (
          <Activity
            key={key}
            mode={key === routeResult.key ? "visible" : "hidden"}
          >
            <Flex
              id={key}
              data-test-id={`route-${key}`}
              sx={{ flexDirection: "column", flex: 1, overflow: "hidden" }}
            >
              <Component key={key} {...props} />
            </Flex>
          </Activity>
        )
      )}
    </RouteContainer>
  );
}

export default memo(CachedRouter);
