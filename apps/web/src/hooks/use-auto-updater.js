import { useEffect, useState } from "react";
import { ElectronEventManager } from "../commands";
import { EVENTS } from "@notesnook/desktop/events";
import { isDesktop } from "../utils/platform";
import checkForUpdate from "../commands/check-for-update";

var checkingForUpdateTimeout = 0;
export default function useAutoUpdater() {
  const [status, setStatus] = useState();

  useEffect(() => {
    function checkingForUpdate() {
      setStatus({ type: "checking" });

      clearTimeout(checkingForUpdateTimeout);
      checkingForUpdateTimeout = setTimeout(() => {
        setStatus({ type: "updated" });
      }, 10000);
    }

    function updateAvailable(info) {
      setStatus({ type: "available", version: info.version });
    }

    function updateNotAvailable(info) {
      setStatus({ type: "updated" });
    }

    function updateDownloadCompleted(info) {
      setStatus({ type: "completed", version: info.version });
    }

    function updateDownloadProgress(progressInfo) {
      setStatus({ type: "downloading", progress: progressInfo.percent });
    }

    ElectronEventManager.subscribe(EVENTS.checkingForUpdate, checkingForUpdate);
    ElectronEventManager.subscribe(EVENTS.updateAvailable, updateAvailable);
    ElectronEventManager.subscribe(
      EVENTS.updateNotAvailable,
      updateNotAvailable
    );
    ElectronEventManager.subscribe(
      EVENTS.updateDownloadCompleted,
      updateDownloadCompleted
    );
    ElectronEventManager.subscribe(
      EVENTS.updateDownloadProgress,
      updateDownloadProgress
    );

    if (isDesktop()) {
      checkingForUpdate();
      checkForUpdate();
    }

    return () => {
      ElectronEventManager.unsubscribeAll();
    };
  }, []);

  return status;
}
