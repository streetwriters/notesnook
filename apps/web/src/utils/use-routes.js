import { useLocation } from "wouter";
import makeMatcher from "wouter/matcher";
import { navigate } from "../navigation";
import { store as selectionStore } from "../stores/selection-store";

export default function useRoutes(routes, options) {
  const [location] = useLocation();
  const matcher = makeMatcher();

  // TODO move this to an extension function
  selectionStore.toggleSelectionMode(false);

  for (var key in routes) {
    const [match, params] = matcher(key, location);
    if (match) {
      return routes[key](params);
    }
  }
  if (!options) return;
  const { fallbackRoute } = options;
  if (fallbackRoute) {
    navigate(fallbackRoute);
  }
}
