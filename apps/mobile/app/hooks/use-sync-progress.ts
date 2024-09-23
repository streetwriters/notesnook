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

import { EVENTS } from "@notesnook/core";
import { useCallback, useEffect, useState } from "react";
import { db } from "../common/database";

export type SyncProgressEventType = {
  type: "upload" | "download";
  total: number;
  current: number;
};

const useSyncProgress = () => {
  const [progress, setProgress] = useState<SyncProgressEventType>();
  const EV = db.eventManager;

  const onProgress = useCallback(
    ({ type, current, total }: SyncProgressEventType) => {
      setProgress({ type, current, total });
    },
    []
  );

  const onSyncComplete = () => {
    setProgress(undefined);
  };
  useEffect(() => {
    EV?.subscribe(EVENTS.syncProgress, onProgress);
    EV?.subscribe(EVENTS.syncCompleted, onSyncComplete);
    return () => {
      EV?.unsubscribe(EVENTS.syncProgress, onProgress);
      EV?.unsubscribe(EVENTS.syncCompleted, onSyncComplete);
    };
  }, [EV, onProgress]);

  return {
    progress
  };
};

export default useSyncProgress;
