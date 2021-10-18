import { useEffect, useState } from "react";
import { ElectronEventManager } from "../commands";
import { EVENTS } from "@notesnook/desktop/events";
import { isDesktop } from "../utils/platform";
import checkForUpdate from "../commands/check-for-update";

var checkingForUpdateTimeout = 0;
export default function useAutoUpdater() {
  const [status, setStatus] = useState();

  useEffect(() => {
    function changeStatus(status) {
      clearTimeout(checkingForUpdateTimeout);
      setStatus(status);
    }

    function checkingForUpdate() {
      changeStatus({ type: "checking" });
      checkingForUpdateTimeout = setTimeout(() => {
        changeStatus({ type: "updated" });
      }, 10000);
    }

    function updateAvailable(info) {
      changeStatus({ type: "available", version: info.version });
    }

    function updateNotAvailable(info) {
      changeStatus({ type: "updated" });
    }

    function updateDownloadCompleted(info) {
      changeStatus({ type: "completed", version: info.version });
    }

    function updateDownloadProgress(progressInfo) {
      changeStatus({ type: "downloading", progress: progressInfo.percent });
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
