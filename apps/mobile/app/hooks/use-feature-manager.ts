import { useIsFeatureAvailable } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useEffect } from "react";
import { presentDialog } from "../components/dialog/functions";
import { eSendEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import SettingsService from "../services/settings";
import { useUserStore } from "../stores/use-user-store";
import { eCloseSimpleDialog } from "../utils/events";

export default function useFeatureManager() {
  const appLockFeature = useIsFeatureAvailable("appLock");
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (!user || appLockFeature?.isAllowed) return;
    const unsub = useUserStore.subscribe((state) => {
      if (!state.appLocked && !appLockFeature?.isAllowed) {
        unsub();
        SettingsService.setProperty("appLockEnabled", false);
        setTimeout(() => {
          presentDialog({
            title: "App Lock Disabled",
            paragraph: appLockFeature?.error,
            positiveText: strings.upgrade(),
            negativeText: strings.cancel(),
            positivePress: async () => {
              eSendEvent(eCloseSimpleDialog);
              Navigation.navigate("PayWall", {
                context: "logged-in"
              });
            }
          });
        }, 1000);
      }
    });
    return () => {
      unsub();
    };
  }, [appLockFeature?.isAllowed]);

  return true;
}
