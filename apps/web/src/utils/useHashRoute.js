import makeMatcher from "wouter/matcher";
import useHashLocation from "./use-hash-location";

export default function useHashRoute(pattern) {
  const [location] = useHashLocation();
  const matcher = makeMatcher();
  return matcher(pattern, location);
}
