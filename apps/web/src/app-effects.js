import React, { useEffect } from "react";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import useVersion, { getCachedVersion } from "./utils/useVersion";
import { resetReminders } from "./common/reminders";
import { isUserPremium } from "./common";
import { db } from "./common/db";
import { CHECK_IDS, EV, EVENTS } from "notes-core/common";

function AppEffects({ isMobile, isTablet, setShow }) {
  var refreshColors = useStore((store) => store.refreshColors);
  var refreshMenuPins = useStore((store) => store.refreshMenuPins);
  var isFocusMode = useStore((store) => store.isFocusMode);
  var isEditorOpen = useStore((store) => store.isEditorOpen);
  var toggleSideMenu = useStore((store) => store.toggleSideMenu);
  var addReminder = useStore((store) => store.addReminder);
  var initUser = useUserStore((store) => store.init);
  var initNotes = useNotesStore((store) => store.init);
  var setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  var version = useVersion();

  useEffect(() => {
    (async function () {
      const cached = getCachedVersion();
      if (!cached) return;
      await import("./common/dialogcontroller").then((dialogs) => {
        if (cached.appUpdated) return dialogs.showAppUpdatedNotice(cached);
        else if (cached.appUpdateable)
          return dialogs.showAppAvailableNotice(cached);
      });
    })();
  }, [version]);

  useEffect(
    function initializeApp() {
      refreshColors();
      refreshMenuPins();
      initUser();
      initNotes();
      (async function () {
        await resetReminders();
        setIsVaultCreated(await db.vault.exists());
      })();
    },
    [
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
            dialogs.showBuyDialog(type)
          );
        return { type, result: false };
      }
    });
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      setShow(false);
    } else {
      if (!isTablet) setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    if (!isMobile && !isTablet) return;
    setShow(!isEditorOpen);
    //setIsEditorOpen(!show);
    // if (isTablet) toggleSideMenu(!isEditorOpen);
    // if (!isEditorOpen && !isTablet && !isMobile) toggleSideMenu(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorOpen, isMobile, isTablet]);

  useEffect(() => {
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    toggleSideMenu(!isMobile);
    if (!isMobile && !isTablet && !isFocusMode) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet, isFocusMode, toggleSideMenu]);

  return <React.Fragment />;
}
export default AppEffects;
