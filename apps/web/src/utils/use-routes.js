import { useLocation } from "wouter";
import makeMatcher from "wouter/matcher";

export default function useRoutes(routes, options) {
  const [location] = useLocation();
  const matcher = makeMatcher();

  for (var key in routes) {
    const [match, params] = matcher(key, location);
    if (match) {
      return routes[key](params);
    }
  }
  if (!options) return;
  const { fallbackRoute } = options;
  if (fallbackRoute && routes[fallbackRoute]) return routes[fallbackRoute]();
}
