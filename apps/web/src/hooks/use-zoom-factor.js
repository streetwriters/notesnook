import { useCallback, useEffect, useState } from "react";
import setZoomFactor from "../commands/set-zoom-factor";

export default function useZoomFactor() {
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (!window.config) return;
    (async function () {
      setZoom(await window.config.zoomFactor());
    })();
  }, []);

  const set = useCallback((zoomFactor) => {
    setZoomFactor(zoomFactor);
    setZoom(zoomFactor);
  }, []);

  return [zoom, set];
}
