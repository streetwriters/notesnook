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
import { isDesktop } from "../utils/platform";
import { checkForUpdate } from "../utils/updater";
import { AppEventManager, AppEvents } from "../common/app-events";

type CompletedUpdateStatus = { type: "completed"; version: string };
type DownloadingUpdateStatus = { type: "downloading"; progress: number };
type AvailableUpdateStatus = { type: "available"; version: string };
type GenericUpdateStatus = { type: "checking" | "updated" };
export type UpdateStatus =
  | AvailableUpdateStatus
  | CompletedUpdateStatus
  | DownloadingUpdateStatus
  | GenericUpdateStatus;

let checkingForUpdateTimeout = 0;
export function useAutoUpdater() {
  const [status, setStatus] = useState<UpdateStatus>();

  useEffect(() => {
    function changeStatus(status?: UpdateStatus) {
      clearTimeout(checkingForUpdateTimeout);
      setStatus(status);
    }

    function checkingForUpdate() {
      changeStatus({ type: "checking" });
      checkingForUpdateTimeout = setTimeout(() => {
        changeStatus({ type: "updated" });
      }, 10000) as unknown as number;
    }

    function updateAvailable(info: { version: string }) {
      changeStatus({
        type: "available",
        version: info.version
      });
    }

    function updateNotAvailable() {
      if (isDesktop()) changeStatus({ type: "updated" });
      else changeStatus();
    }

    function updateDownloadCompleted(info: { version: string }) {
      changeStatus({ type: "completed", version: info.version });
    }

    function updateDownloadProgress(progressInfo: { percent: number }) {
      changeStatus({ type: "downloading", progress: progressInfo.percent });
    }

    const checkingForUpdateEvent = AppEventManager.subscribe(
      AppEvents.checkingForUpdate,
      checkingForUpdate
    );
    const updateAvailableEvent = AppEventManager.subscribe(
      AppEvents.updateAvailable,
      updateAvailable
    );
    const updateNotAvailableEvent = AppEventManager.subscribe(
      AppEvents.updateNotAvailable,
      updateNotAvailable
    );
    const updateCompletedEvent = AppEventManager.subscribe(
      AppEvents.updateDownloadCompleted,
      updateDownloadCompleted
    );
    const updateProgressEvent = AppEventManager.subscribe(
      AppEvents.updateDownloadProgress,
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
