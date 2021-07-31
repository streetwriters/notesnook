import React, { useEffect } from "react";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import useVersion, { getCachedVersion } from "./utils/useVersion";
import { resetReminders } from "./common/reminders";
import { introduceFeatures } from "./common";
import { db } from "./common/db";
import { CHECK_IDS, EV, EVENTS } from "notes-core/common";
import { registerKeyMap } from "./common/key-map";
import { isUserPremium } from "./hooks/use-is-user-premium";

function AppEffects({ isMobile, isTablet, setShow, slideToIndex }) {
  const refreshColors = useStore((store) => store.refreshColors);
  const refreshMenuPins = useStore((store) => store.refreshMenuPins);
  const updateLastSynced = useStore((store) => store.updateLastSynced);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const isEditorOpen = useStore((store) => store.isEditorOpen);
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isSideMenuOpen = useStore((store) => store.isSideMenuOpen);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  // const [version] = useVersion();

  // useEffect(() => {
  //   (async function () {
  //     const cached = getCachedVersion();
  //     if (!cached) return;
  //     await import("./common/dialogcontroller").then((dialogs) => {
  //       if (cached.appUpdated) return dialogs.showAppUpdatedNotice(cached);
  //       else if (cached.appUpdateable)
  //         return dialogs.showAppAvailableNotice(cached);
  //     });
  //   })();
  // }, [version]);

  useEffect(
    function initializeApp() {
      refreshColors();
      refreshMenuPins();
      initUser();
      initNotes();
      updateLastSynced();
      (async function () {
        await resetReminders();
        setIsVaultCreated(await db.vault.exists());
      })();
    },
    [
      updateLastSynced,
      refreshColors,
      refreshMenuPins,
      initUser,
      initNotes,
      addReminder,
      setIsVaultCreated,
    ]
  );

  useEffect(() => {
    EV.subscribe(EVENTS.userCheckStatus, async (type) => {
      if (isUserPremium()) {
        return { type, result: true };
      } else {
        if (type !== CHECK_IDS.databaseSync)
          await import("./common/dialogcontroller").then((dialogs) =>
            dialogs.showBuyDialog()
          );
        return { type, result: false };
      }
    });
    registerKeyMap();
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      setShow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    introduceFeatures();
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    slideToIndex(isSideMenuOpen ? 0 : 1);
  }, [isMobile, slideToIndex, isSideMenuOpen]);

  useEffect(() => {
    if (!isMobile) return;
    slideToIndex(isEditorOpen ? 2 : 1);
  }, [isMobile, slideToIndex, isEditorOpen]);

  useEffect(() => {
    toggleSideMenu(!isMobile);
    if (!isMobile && !isTablet && !isFocusMode) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet, isFocusMode, toggleSideMenu]);

  return <React.Fragment />;
}
export default AppEffects;
