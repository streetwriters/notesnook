import makeMatcher from "wouter/matcher";
import useHashLocation from "./use-hash-location";

export default function useHashRoutes(routes) {
  const [location] = useHashLocation();
  const matcher = makeMatcher();
  for (var key in routes) {
    const [match, params] = matcher(key, location);
    if (match) {
      return routes[key](params);
    }
  }
}
