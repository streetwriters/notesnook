import { useEffect, useState } from "react";
import { AppEventManager } from "../common/app-events";
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

    function updateNotAvailable() {
      changeStatus({ type: "updated" });
    }

    function updateDownloadCompleted(info) {
      changeStatus({ type: "completed", version: info.version });
    }

    function updateDownloadProgress(progressInfo) {
      changeStatus({ type: "downloading", progress: progressInfo.percent });
    }

    const checkingForUpdateEvent = AppEventManager.subscribe(
      EVENTS.checkingForUpdate,
      checkingForUpdate
    );
    const updateAvailableEvent = AppEventManager.subscribe(
      EVENTS.updateAvailable,
      updateAvailable
    );
    const updateNotAvailableEvent = AppEventManager.subscribe(
      EVENTS.updateNotAvailable,
      updateNotAvailable
    );
    const updateCompletedEvent = AppEventManager.subscribe(
      EVENTS.updateDownloadCompleted,
      updateDownloadCompleted
    );
    const updateProgressEvent = AppEventManager.subscribe(
      EVENTS.updateDownloadProgress,
      updateDownloadProgress
    );

    if (isDesktop()) {
      checkingForUpdate();
      checkForUpdate();

    return () => {
      checkingForUpdateEvent.unsubscribe();
      updateAvailableEvent.unsubscribe();
      updateNotAvailableEvent.unsubscribe();
      updateCompletedEvent.unsubscribe();
      updateProgressEvent.unsubscribe();
    };
  }, []);

  return status;
}
