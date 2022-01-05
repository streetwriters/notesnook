import { useEffect } from "react";
import { AppEventManager, AppEvents } from "../common/app-events";
import { useState } from "react";

export default function useStatus() {
  const [statuses, setStatuses] = useState({});
  useEffect(() => {
    const updateStatusEvent = AppEventManager.subscribe(
      AppEvents.UPDATE_STATUS,
      (param) => {
        const { key, status, progress, icon } = param;
        setStatuses((statuses) => {
          if (!key) return statuses;
          const statusText = status || statuses[key]?.status;
          return {
            ...statuses,
            [key]: { key, status: statusText, progress, icon },
          };
        });
      }
    );
    const removeStatusEvent = AppEventManager.subscribe(
      AppEvents.REMOVE_STATUS,
      (key) => {
        setStatuses((statuses) => {
          if (!key || !statuses[key]) return statuses;
          const clone = { ...statuses };
          delete clone[key];
          return clone;
        });
      }
    );
    return () => {
      updateStatusEvent.unsubscribe();
      removeStatusEvent.unsubscribe();
    };
  }, [setStatuses]);

  return Object.values(statuses);
}

export function updateStatus({ key, status, progress, icon }) {
  AppEventManager.publish(AppEvents.UPDATE_STATUS, {
    key,
    status,
    progress,
    icon,
  });
}

export function removeStatus(key) {
  AppEventManager.publish(AppEvents.REMOVE_STATUS, key);
}
