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
