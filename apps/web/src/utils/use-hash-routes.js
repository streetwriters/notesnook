import makeMatcher from "wouter/matcher";
import useHashLocation from "./use-hash-location";

export default function useHashRoutes(routes) {
  const [location] = useHashLocation();
  const matcher = makeMatcher();
  console.log("Location", location);
  for (var key in routes) {
    const [match, params] = matcher(key, location);
    console.log("isMatch:", match, key, location);
    if (match) {
      return routes[key](params);
    }
  }
}
