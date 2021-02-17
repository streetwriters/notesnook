import React from "react";
import useHashRoutes from "../../utils/use-hash-routes";
import hashroutes from "../../navigation/hash-routes";
import EditorPlaceholder from "../editor/-placeholder";

function HashRouter() {
  const routeResult = useHashRoutes(hashroutes);
  return routeResult || <EditorPlaceholder />;
}
export default HashRouter;
