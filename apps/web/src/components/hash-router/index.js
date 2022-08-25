import React from "react";
import useHashRoutes from "../../hooks/use-hash-routes";
import hashroutes from "../../navigation/hash-routes";

function HashRouter() {
  const routeResult = useHashRoutes(hashroutes);
  return routeResult || null;
}
export default React.memo(HashRouter, () => true);
