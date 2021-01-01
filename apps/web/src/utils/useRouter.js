import React from "react";
import { useRouter } from "wouter";

export default function useRoutes(routes, options) {
  const router = useRouter();
  const [location] = router.hook();
  const matcher = router.matcher;

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
