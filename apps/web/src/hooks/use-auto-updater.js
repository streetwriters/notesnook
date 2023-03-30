/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { useEffect, useState } from "react";
import { AppEventManager } from "../common/app-events";
import { EVENTS } from "@notesnook/desktop";
import {
  showUpdateAvailableNotice,
  showUpdateReadyNotice
} from "../common/dialog-controller";
import { isDesktop } from "../utils/platform";
import { checkForUpdate } from "../utils/updater";

var checkingForUpdateTimeout = 0;
export function useAutoUpdater() {
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
      changeStatus({
        type: "available",
        version: info.version
      });
      showUpdateAvailableNotice({
        version: info.version
      });
    }

    function updateNotAvailable() {
      if (isDesktop()) changeStatus({ type: "updated" });
      else changeStatus();
    }

    function updateDownloadCompleted(info) {
      changeStatus({ type: "completed", version: info.version });
      showUpdateReadyNotice({ version: info.version });
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
