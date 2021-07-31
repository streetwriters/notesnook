import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { NavigationEvents } from "../../navigation";
import useRoutes from "../../utils/use-routes";
import RouteContainer from "../route-container";
import ThemeProvider from "../theme-provider";
import routes from "../../navigation/routes";

var cache = {};
function CachedRouter() {
  const RouteResult = useRoutes(routes, { fallbackRoute: "/" });
  useEffect(() => {
    if (!RouteResult) return;
    NavigationEvents.publish("onNavigate", RouteResult);
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
  }, [RouteResult]);

  return (
    <RouteContainer
      id="mainRouteContainer"
      type={RouteResult?.type}
      title={RouteResult?.title}
      subtitle={RouteResult?.subtitle}
      buttons={RouteResult?.buttons}
    />
  );
}

export function clearRouteCache() {
  cache = {};
}

export default CachedRouter;
