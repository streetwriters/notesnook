//@ts-ignore
import { EVENTS } from 'notes-core/common';
import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../database';

export type SyncProgressEventType = {
  type: 'upload' | 'download';
  total: number;
  current: number;
};

const useSyncProgress = () => {
  const [progress, setProgress] = useState<SyncProgressEventType>();
  const EV = db.eventManager;

  const onProgress = useCallback(({ type, current, total }: SyncProgressEventType) => {
    //@ts-ignore

    setProgress({ type, current, total });
  }, []);

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
  }, []);

  return {
    progress
  };
};

export default useSyncProgress;
