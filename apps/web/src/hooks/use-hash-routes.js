import makeMatcher from "wouter/matcher";
import useHashLocation from "./use-hash-location";

var lastRoute = null;
export default function useHashRoutes(routes) {
  const [{ location, update }] = useHashLocation();
  if (!update) return lastRoute;

  const matcher = makeMatcher();
  for (var key in routes) {
    const [match, params] = matcher(key, location);
    if (match) {
      const route = routes[key](params);
      if (!route) return lastRoute;
      lastRoute = route;
      return route;
    }
  }
}
