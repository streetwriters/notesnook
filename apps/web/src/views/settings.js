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

import { useEffect, useMemo, useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import * as Icon from "../components/icons";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import { useStore as useAppStore } from "../stores/app-store";
import AccentItem from "../components/accent-item";
import {
  showEmailVerificationDialog,
  showImportDialog,
  showIssueDialog,
  showTrackingDetailsDialog,
  showClearSessionsConfirmation,
  showLogoutConfirmation,
  showRecoveryKeyDialog,
  showLoadingDialog,
  showBuyDialog,
  showPasswordDialog,
  showMultifactorDialog,
  showAttachmentsDialog,
  show2FARecoveryCodesDialog,
  showToolbarConfigDialog,
  showPromptDialog,
  showEmailChangeDialog
} from "../common/dialog-controller";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import { createBackup, importBackup, verifyAccount } from "../common";
import { db } from "../common/db";
import { usePersistentState } from "../hooks/use-persistent-state";
import dayjs from "dayjs";
import { FlexScrollContainer } from "../components/scroll-container";
import { showToast } from "../utils/toast";
import { hardNavigate, hashNavigate } from "../navigation";
import { appVersion } from "../utils/version";
import { CHECK_IDS } from "@notesnook/core/common";
import Tip from "../components/tip";
import Toggle from "../components/toggle";
import {
  getPlatform,
  isDesktop,
  isMacStoreApp,
  isTesting
} from "../utils/platform";
import Vault from "../common/vault";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { Slider } from "@theme-ui/components";
import useZoomFactor from "../hooks/use-zoom-factor";
import { PATHS } from "@notesnook/desktop/paths";
import { openPath } from "../commands/open";
import { getAllAccents } from "@notesnook/theme";
import { debounce } from "../utils/debounce";
import { clearLogs, downloadLogs } from "../utils/logger";
import { exportNotes } from "../common/export";
import { scheduleBackups } from "../common/reminders";
import usePrivacyMode from "../hooks/use-privacy-mode";
import { useTelemetry } from "../hooks/use-telemetry";
import useSpellChecker from "../hooks/use-spell-checker";

function subscriptionStatusToString(user) {
  const status = user?.subscription?.type;

  if (status === SUBSCRIPTION_STATUS.BETA) return "Beta";
  else if (status === SUBSCRIPTION_STATUS.TRIAL) return "Trial";
  else if (
    status === SUBSCRIPTION_STATUS.PREMIUM ||
    status === SUBSCRIPTION_STATUS.PREMIUM_CANCELED
  )
    return "Pro";
  else if (status === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED) return "Expired";
  else return "Basic";
}

const otherItems = [
  {
    title: "Terms of service",
    description: "Read our terms of service.",
    link: "https://notesnook.com/tos"
  },
  {
    title: "Privacy policy",
    description:
      "We do not share, sell, read, or use your data. Read our privacy policy.",
    link: "https://notesnook.com/privacy"
  },
  {
    title: "Report an issue",
    description: "Facing an issue? Click here to create a bug report.",
    onClick: () => showIssueDialog()
  },
  {
    title: "Join our Discord community",
    description:
      "We are not ghosts. Come chat with us and share your experience.",
    link: "https://discord.com/invite/zQBK97EE22"
  },
  {
    title: isMacStoreApp() ? "Download for iOS" : "Download for iOS & Android",
    description: isMacStoreApp()
      ? "Notesnook is also available on iOS"
      : "Notesnook is available on Android & iOS",
    link: isMacStoreApp()
      ? "https://apps.apple.com/us/app/notesnook-take-private-notes/id1544027013"
      : "https://notesnook.com/"
  },
  {
    title: "Documentation",
    description: "Learn about every feature in Notesnook and how it works",
    link: "https://docs.notesnook.com/"
  },
  {
    title: "Roadmap",
    description: "See what the future of Notesnook is going to be like!",
    link: "https://notesnook.com/roadmap"
  }
];

function Settings() {
  const [groups, setGroups] = useState({
    sync: false,
    appearance: false,
    editor: false,
    mfa: false,
    backup: false,
    importer: false,
    privacy: false,
    developer: false,
    notifications: false,
    other: true
  });
  const isVaultCreated = useAppStore((store) => store.isVaultCreated);
  const isSyncEnabled = useAppStore((store) => store.isSyncEnabled);
  const isRealtimeSyncEnabled = useAppStore(
    (store) => store.isRealtimeSyncEnabled
  );
  const isAutoSyncEnabled = useAppStore((store) => store.isAutoSyncEnabled);
  const toggleAutoSync = useAppStore((store) => store.toggleAutoSync);
  const toggleSync = useAppStore((store) => store.toggleSync);
  const toggleRealtimeSync = useAppStore((store) => store.toggleRealtimeSync);
  const setIsVaultCreated = useAppStore((store) => store.setIsVaultCreated);
  const refreshApp = useAppStore((store) => store.refresh);
  const refreshNotes = useNoteStore((store) => store.refresh);
  const sync = useAppStore((store) => store.sync);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);
  const [zoomFactor, setZoomFactor] = useZoomFactor();

  const toggleFollowSystemTheme = useThemeStore(
    (store) => store.toggleFollowSystemTheme
  );
  const toggleDoubleSpacedLines = useSettingStore(
    (store) => store.toggleDoubleSpacedLines
  );
  const doubleSpacedLines = useSettingStore((store) => store.doubleSpacedLines);
  const encryptBackups = useSettingStore((store) => store.encryptBackups);
  const toggleEncryptBackups = useSettingStore(
    (store) => store.toggleEncryptBackups
  );
  const user = useUserStore((store) => store.user);
  const refreshUser = useUserStore((store) => store.refreshUser);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const [backupReminderOffset, setBackupReminderOffset] = usePersistentState(
    "backupReminderOffset",
    0
  );
  const [debugMode, setDebugMode] = usePersistentState("debugMode", false);
  const [homepage, setHomepage] = usePersistentState("homepage", 0);
  const [backupStorageLocation, setBackupStorageLocation] = usePersistentState(
    "backupStorageLocation",
    PATHS.backupsDirectory
  );
  const [enableTelemetry, setEnableTelemetry] = useTelemetry();
  const spellChecker = useSpellChecker();
  const [privacyMode, setPrivacyMode] = usePrivacyMode();
  const [showReminderNotifications, setShowReminderNotifications] =
    usePersistentState("reminderNotifications", true);
  const [corsProxy, setCorsProxy] = usePersistentState(
    "corsProxy",
    "https://cors.notesnook.com"
  );

  useEffect(() => {
    (async () => {
      await scheduleBackups();
    })();
  }, [backupReminderOffset]);

  return (
    <FlexScrollContainer style={{ height: "100%" }}>
      <Flex variant="columnFill" px={2}>
        {isLoggedIn ? (
          <AccountStatus user={user} />
        ) : (
          <Flex
            py={1}
            sx={{ borderRadius: "default", cursor: "pointer" }}
            onClick={async () => {
              hardNavigate("/login", { redirect: "/settings" });
            }}
          >
            <Flex
              sx={{
                flex: "1 1 auto",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Flex>
                <Flex
                  variant="columnCenter"
                  bg="shade"
                  mr={2}
                  sx={{
                    borderRadius: 80,
                    size: 35
                  }}
                >
                  <Icon.User size={20} color="primary" />
                </Flex>
                <Flex variant="columnCenter" sx={{ alignItems: "flex-start" }}>
                  <Text variant="subBody">You are not logged in</Text>
                  <Text variant="body" sx={{ fontSize: "body" }}>
                    Login to sync your notes
                  </Text>
                </Flex>
              </Flex>
              <Icon.ChevronRight size={20} color="primary" />
            </Flex>
          </Flex>
        )}
        {isLoggedIn && (
          <>
            <Button
              variant="list"
              data-test-id="backup-recovery-key"
              onClick={async () => {
                if (await verifyAccount()) await showRecoveryKeyDialog();
              }}
            >
              <Tip
                text="Backup data recovery key"
                tip="In case you lose your password, you can recover your data using your recovery key."
              />
            </Button>
            <Button
              variant="list"
              onClick={async () => {
                await showEmailChangeDialog();
                await refreshUser();
              }}
            >
              <Tip
                text="Change account email"
                tip="Set a new email for your account"
              />
            </Button>
            <Button
              variant="list"
              data-test-id="settings-change-password"
              onClick={async () => {
                const result = await showPasswordDialog(
                  "change_account_password",
                  async (data) => {
                    await db.user.clearSessions();
                    return db.user.changePassword(
                      data.oldPassword,
                      data.newPassword
                    );
                  }
                );
                if (result) {
                  showToast("success", "Account password changed!");
                }
              }}
            >
              <Tip
                text="Change account password"
                tip="Set a new password for your account"
              />
            </Button>

            <Button variant="list" onClick={() => showAttachmentsDialog()}>
              <Tip
                text="Manage attachments"
                tip="Re-upload, delete & manage your attachments."
              />
            </Button>
            <Button
              data-test-id="settings-logout"
              variant="list"
              onClick={async () => {
                if (await showLogoutConfirmation()) {
                  await showLoadingDialog({
                    title: "You are being logged out",
                    action: () => db.user.logout(true)
                  });
                  showToast("success", "You have been logged out.");
                }
              }}
              sx={{ ":hover": { borderColor: "error" } }}
              bg="errorBg"
              mx={-2}
              px={2}
            >
              <Tip
                text="Logout"
                color="error"
                tip="Log out of your account and clear all data."
              />
            </Button>
          </>
        )}

        {isLoggedIn && user.mfa && (
          <>
            <Header
              title="Two-factor authentication"
              isOpen={groups.mfa}
              onClick={() => {
                setGroups((g) => ({ ...g, mfa: !g.mfa }));
              }}
            />
            {groups.mfa &&
              (user.mfa.isEnabled ? (
                <>
                  <Button
                    variant="list"
                    onClick={async () => {
                      if (await verifyAccount()) {
                        await showMultifactorDialog(user.mfa.primaryMethod);
                        await refreshUser();
                      }
                    }}
                  >
                    <Tip
                      text={
                        user.mfa.secondaryMethod
                          ? "Reconfigure fallback 2FA method"
                          : "Add fallback 2FA method"
                      }
                      tip="You can use the fallback 2FA method in case you are unable to login via the primary method."
                    />
                  </Button>

                  <Button
                    variant="list"
                    onClick={async () => {
                      if (await verifyAccount()) {
                        await show2FARecoveryCodesDialog(
                          user.mfa.primaryMethod
                        );
                        await refreshUser();
                      }
                    }}
                  >
                    <Tip
                      text="View recovery codes"
                      tip={`Recovery codes can be used to login in case you cannot use any of the other 2FA methods. You have ${user.mfa.remainingValidCodes} recovery codes left.`}
                    />
                  </Button>
                  <Button
                    variant="list"
                    onClick={async () => {
                      if (await verifyAccount()) {
                        await db.mfa.disable();
                        showToast(
                          "success",
                          "Two-factor authentication disabled."
                        );
                        await refreshUser();
                      }
                    }}
                  >
                    <Tip
                      text="Disable two-factor authentication"
                      tip="You can disable 2FA if you want to reset or change 2FA settings."
                    />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="list"
                    onClick={async () => {
                      if (await verifyAccount()) {
                        await showMultifactorDialog();
                        await refreshUser();
                      }
                    }}
                  >
                    <Tip
                      text="Enable two-factor authentication"
                      tip="Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in."
                    />
                  </Button>
                </>
              ))}
          </>
        )}
        {isLoggedIn && (
          <>
            <Header
              title="Sync settings"
              isOpen={groups.sync}
              onClick={() => {
                setGroups((g) => ({ ...g, sync: !g.sync }));
              }}
            />
            {groups.sync && (
              <>
                <Toggle
                  title="Disable realtime sync in editor"
                  onTip="You will have to manually open/close a note to see new changes."
                  offTip="All changes in the editor will be synced & updated in realtime."
                  onToggled={toggleRealtimeSync}
                  isToggled={!isRealtimeSyncEnabled}
                />
                <Toggle
                  title="Disable sync"
                  onTip="All changes to or from this device won't be synced."
                  offTip="All changes to or from this device will be synced."
                  onToggled={toggleSync}
                  isToggled={!isSyncEnabled}
                />
                <Toggle
                  title="Disable auto sync"
                  onTip="You will have to manually run the sync to transfer your changes to other devices."
                  offTip="All changes will automatically sync to your other device."
                  onToggled={toggleAutoSync}
                  isToggled={!isAutoSyncEnabled}
                />
                <Button variant="list" onClick={() => sync(true, true)}>
                  <Tip
                    text="Having problems with syncing?"
                    tip="Try force sync to resolve issues with syncing"
                  />
                </Button>
              </>
            )}
          </>
        )}
        <Header
          title="Appearance"
          isOpen={groups.appearance}
          onClick={() => {
            setGroups((g) => ({ ...g, appearance: !g.appearance }));
          }}
        />
        {groups.appearance && (
          <>
            <Tip
              text="Accent color"
              tip="Choose a color to use as accent color"
              sx={{ py: 2 }}
            />
            <Flex
              sx={{
                flexWrap: "wrap",
                borderRadius: "default",
                justifyContent: "left"
              }}
            >
              {getAllAccents().map((color) => (
                <AccentItem
                  key={color.code}
                  code={color.code}
                  label={color.label}
                />
              ))}
            </Flex>
            <Toggle
              title="Dark mode"
              onTip="Dark mode is on"
              offTip="Dark mode is off"
              onToggled={toggleNightMode}
              isToggled={theme === "dark"}
              onlyIf={!followSystemTheme}
            />
            <Toggle
              title="Follow system theme"
              onTip="Switch app theme according to browser theme"
              offTip="Keep app theme independent"
              onToggled={toggleFollowSystemTheme}
              isToggled={followSystemTheme}
            />
            <OptionsItem
              title={"Homepage"}
              tip={"Default screen to open on app startup."}
              options={["Notes", "Notebooks", "Favorites", "Tags"]}
              premium
              selectedOption={homepage}
              onSelectionChanged={(_option, index) => setHomepage(index)}
            />
            {isDesktop() && (
              <>
                <Tip
                  sx={{ pt: 2 }}
                  text="Zoom factor"
                  tip={`Zoom in or out the app content. (${zoomFactor})`}
                />
                <Slider
                  min={0.5}
                  max={2.0}
                  defaultValue={zoomFactor}
                  step={0.1}
                  onChange={debounce((e) => {
                    setZoomFactor(e.target.valueAsNumber);
                  }, 500)}
                />
              </>
            )}
          </>
        )}

        <Header
          title="Editor settings"
          isOpen={groups.editor}
          onClick={() => {
            setGroups((g) => ({ ...g, editor: !g.editor }));
          }}
        />
        {groups.editor && (
          <>
            <Toggle
              title="Use double spaced lines"
              onTip="New lines will be double spaced (old ones won't be affected)."
              offTip="New lines will be single spaced (old ones won't be affected)."
              onToggled={() => {
                toggleDoubleSpacedLines();
                showToast(
                  "success",
                  "Re-open the editor for changes to take effect."
                );
              }}
              isToggled={doubleSpacedLines}
            />
            <Button
              variant="list"
              onClick={async () => {
                await showToolbarConfigDialog();
              }}
            >
              <Tip
                text="Configure toolbar"
                tip="Customize the editor toolbar to fit your needs."
              />
            </Button>

            <Toggle
              title="Enable spellchecker"
              onToggled={() => spellChecker.toggle(!spellChecker.enabled)}
              isToggled={spellChecker.enabled}
            />
          </>
        )}

        <Header
          title="Notifications"
          isOpen={groups.notifications}
          onClick={() => {
            setGroups((g) => ({ ...g, notifications: !g.notifications }));
          }}
        />
        {groups.notifications && (
          <>
            <Toggle
              title="Reminder notifications"
              onTip="Reminder notifications will be shown on this device"
              offTip="Reminder notifications will not be shown on this device"
              onToggled={() => setShowReminderNotifications((s) => !s)}
              isToggled={showReminderNotifications}
            />
          </>
        )}
        <Header
          testId={"backup-restore"}
          title="Backup & restore"
          isOpen={groups.backup}
          onClick={() => {
            setGroups((g) => ({ ...g, backup: !g.backup }));
          }}
        />

        {groups.backup && (
          <>
            <Button
              data-test-id={"backup-data"}
              variant="list"
              onClick={async () => {
                if (!isUserPremium() && encryptBackups) toggleEncryptBackups();
                if (await verifyAccount()) await createBackup();
              }}
            >
              <Tip
                text="Backup data"
                tip="Create a backup file of all your data"
              />
            </Button>
            <OptionsItem
              title={"Export all your notes"}
              tip={
                "Create a zip file containing all your notes as TXT, MD or HTML files"
              }
              options={["Text", "Markdown", "HTML"]}
              selectedOption={-1}
              onSelectionChanged={async (option) => {
                await db.notes.init();
                const format =
                  option === "Text"
                    ? "txt"
                    : option === "Markdown"
                    ? "md"
                    : "html";
                await exportNotes(
                  format,
                  db.notes.all.map((n) => n.id)
                );
              }}
            />
            {(isLoggedIn || isTesting()) && (
              <>
                <Button
                  data-test-id="restore-backup"
                  variant="list"
                  onClick={async () => {
                    await importBackup();
                    await refreshApp();
                  }}
                >
                  <Tip
                    text="Restore backup"
                    tip="Restore data from a backup file"
                  />
                </Button>
                <Toggle
                  title="Encrypt backups"
                  testId="encrypt-backups"
                  onTip="All backup files will be encrypted"
                  offTip="Backup files will not be encrypted"
                  onToggled={toggleEncryptBackups}
                  premium={CHECK_IDS.backupEncrypt}
                  isToggled={encryptBackups}
                />

                <OptionsItem
                  title={isDesktop() ? "Automatic backups" : "Backup reminders"}
                  tip={
                    isDesktop()
                      ? "Automatically backup my data"
                      : "Remind me to backup my data"
                  }
                  options={["Never", "Daily", "Weekly", "Monthly"]}
                  premium="backups"
                  selectedOption={backupReminderOffset}
                  onSelectionChanged={async (_option, index) =>
                    setBackupReminderOffset(index)
                  }
                />
                {isDesktop() ? (
                  <Button
                    key={"backupLocation"}
                    variant="list"
                    onClick={async () => {
                      const location = await window.native.selectDirectory({
                        title: "Select where Notesnook should save backups",
                        defaultPath:
                          backupStorageLocation || PATHS.backupsDirectory
                      });
                      if (!location) return;
                      setBackupStorageLocation(location);
                    }}
                  >
                    <Tip
                      text={"Change backups storage location"}
                      tip={backupStorageLocation}
                    />
                  </Button>
                ) : null}
              </>
            )}
          </>
        )}

        <Header
          title="Notesnook Importer"
          isOpen={groups.importer}
          testId="settings-importer"
          onClick={() => {
            setGroups((g) => ({ ...g, importer: !g.importer }));
          }}
        />
        {groups.importer && (
          <>
            <Button
              key={"importer"}
              data-test-id="settings-importer-import"
              variant="list"
              onClick={() => showImportDialog()}
            >
              <Tip
                text={"Import from ZIP file"}
                tip={
                  "Import your notes from other notes apps using Notesnook Importer."
                }
              />
            </Button>
          </>
        )}

        <Header
          title="Privacy & security"
          isOpen={groups.privacy}
          onClick={() => {
            setGroups((g) => ({ ...g, privacy: !g.privacy }));
          }}
        />
        {groups.privacy && (
          <>
            {isVaultCreated ? (
              <>
                <Button
                  variant="list"
                  onClick={() => hashNavigate("/vault/changePassword")}
                >
                  <Tip
                    text="Change vault password"
                    tip={"Set a new password for your vault"}
                  />
                </Button>
                <Button
                  variant="list"
                  onClick={async () => {
                    if (await Vault.clearVault()) {
                      refreshNotes();
                      showToast("success", "Vault cleared.");
                    }
                  }}
                >
                  <Tip
                    text="Clear vault"
                    tip="Unlock all locked notes and clear vault"
                  />
                </Button>
                <Button
                  variant="list"
                  onClick={async () => {
                    if (
                      (await Vault.deleteVault()) &&
                      !(await db.vault.exists())
                    ) {
                      setIsVaultCreated(false);
                      await refreshApp();
                      showToast("success", "Vault deleted.");
                    }
                  }}
                  sx={{ ":hover": { borderColor: "error" } }}
                  bg="errorBg"
                  mx={-2}
                  px={2}
                >
                  <Tip
                    color="error"
                    text="Delete vault"
                    tip="Delete vault (and optionally remove all locked notes)"
                  />
                </Button>
              </>
            ) : (
              <Button
                variant="list"
                onClick={async () => {
                  hashNavigate("/vault/create");
                }}
              >
                <Tip
                  text="Create vault"
                  tip="Create a password-encrypted vault for your notes"
                />
              </Button>
            )}
            <Button
              variant="list"
              onClick={async () => {
                const result = await showPromptDialog({
                  title: "CORS bypass proxy",
                  description:
                    "You can set a custom proxy URL to increase your privacy.",
                  defaultValue: corsProxy
                });
                if (!result) return;
                const url = new URL(result);
                setCorsProxy(`${url.protocol}//${url.hostname}`);
              }}
            >
              <Tip
                text="Custom CORS proxy"
                tip={
                  <>
                    <em>{corsProxy}</em>
                    <br />
                    CORS proxy is required to directly download images from
                    within the Notesnook app. It allows Notesnook to bypass
                    browser restrictions by using a proxy. You can set a custom
                    proxy URL to increase your privacy.
                  </>
                }
              />
            </Button>
            <Toggle
              title="Enable telemetry"
              onTip="Usage data & crash reports will be sent to us (no 3rd party involved) for analytics. All data is anonymous as mentioned in our privacy policy."
              offTip={"Do not collect any data or crash reports"}
              onToggled={() => {
                setEnableTelemetry(!enableTelemetry);
              }}
              isToggled={enableTelemetry}
            />
            <Button variant="list" onClick={showTrackingDetailsDialog}>
              <Tip
                text="What do we collect?"
                tip="Read details of all usage data we collect."
              />
            </Button>
            {isDesktop() && getPlatform() !== "linux" && (
              <Toggle
                title="Privacy mode"
                onTip="Prevent Notesnook app from being captured by any screen capturing software like TeamViewer & AnyDesk."
                offTip="Allow screen capturing of the Notesnook app."
                onToggled={() => {
                  setPrivacyMode(!privacyMode);
                }}
                isToggled={privacyMode}
              />
            )}
          </>
        )}

        <Header
          title="Developer options"
          isOpen={groups.developer}
          onClick={() => {
            setGroups((g) => ({ ...g, developer: !g.developer }));
          }}
        />
        {groups.developer && (
          <>
            <Toggle
              title="Debug mode"
              onTip="Show debug options on items"
              offTip="Hide debug options from items"
              onToggled={() => setDebugMode(!debugMode)}
              isToggled={debugMode}
            />
            <Button variant="list" onClick={downloadLogs}>
              <Tip
                text="Download logs"
                tip="Logs are stored locally & do not contain any sensitive information."
              />
            </Button>
            <Button variant="list" onClick={clearLogs}>
              <Tip
                text="Clear logs"
                tip="Clear all logs stored in the database."
              />
            </Button>
            {isDesktop() && (
              <Button
                variant="list"
                onClick={() => {
                  openPath(PATHS.logsDirectory);
                }}
              >
                <Tip
                  text="Open logs directory"
                  tip="Show the directory where log files are stored."
                />
              </Button>
            )}
          </>
        )}

        <Header
          title="Other"
          isOpen={groups.other}
          onClick={() => {
            setGroups((g) => ({ ...g, other: !g.other }));
          }}
        />

        {groups.other && (
          <>
            {otherItems.map((item) => (
              <Button
                key={item.title}
                variant="list"
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.link) window.open(item.link, "_blank");
                }}
              >
                <Tip text={item.title} tip={item.description} />
              </Button>
            ))}
            <Tip
              sx={{ mt: 2 }}
              text="About"
              tip={`version ${appVersion.formatted}`}
            />
          </>
        )}
        {isLoggedIn && (
          <Flex
            sx={{
              border: "2px solid var(--error)",
              borderRadius: "default",
              flexDirection: "column"
            }}
            p={1}
            my={2}
          >
            <Text variant={"body"} sx={{ fontWeight: "bold", color: "error" }}>
              DANGER ZONE
            </Text>
            <Button
              variant="list"
              onClick={async () => {
                if (!(await showClearSessionsConfirmation())) return;

                await db.user.clearSessions();
                await showToast(
                  "success",
                  "You have been logged out from all other devices."
                );
              }}
            >
              <Tip
                text="Logout from all other devices"
                tip="Force logout from all other logged in devices."
              />
            </Button>
            <Button
              variant="list"
              onClick={async () => {
                return showPasswordDialog(
                  "delete_account",
                  async ({ password }) => {
                    await db.user.deleteUser(password);
                    return true;
                  }
                );
              }}
            >
              <Tip
                text="Delete account"
                tip="Permanently delete account and logout from all devices."
              />
            </Button>
          </Flex>
        )}
      </Flex>
    </FlexScrollContainer>
  );
}

export default Settings;

function OptionsItem(props) {
  const {
    title,
    tip,
    options,
    selectedOption,
    onSelectionChanged,
    onlyIf,
    premium
  } = props;

  if (onlyIf === false) return null;
  return (
    <Flex
      py={2}
      sx={{
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        ":hover": { borderBottomColor: "primary" },
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <Tip text={title} tip={tip} />
      <Flex
        mt={2}
        bg="border"
        sx={{
          borderRadius: "default",
          overflow: "hidden",
          justifyContent: "space-evenly",
          flexWrap: "wrap"
        }}
      >
        {options.map((option, index) => (
          <Text
            key={option}
            bg={selectedOption === index ? "primary" : "transparent"}
            variant="subBody"
            p={2}
            py={1}
            onClick={async () => {
              if (isUserPremium() || !premium)
                onSelectionChanged(option, index);
              else {
                await showBuyDialog();
              }
            }}
            sx={{
              ":hover": { color: selectedOption === index ? "static" : "text" },
              flex: 1,
              textAlign: "center",
              color: selectedOption === index ? "static" : "bgSecondaryText",
              minWidth: 100
            }}
          >
            {option}
          </Text>
        ))}
      </Flex>
    </Flex>
  );
}

function AccountStatus(props) {
  const { user } = props;
  const {
    isTrial,
    isBeta,
    isPro,
    isBasic,
    isProCancelled,
    isProExpired,
    remainingDays
  } = useMemo(() => {
    const type = user?.subscription?.type;
    const expiry = user?.subscription?.expiry;
    if (!type || !expiry) return { isBasic: true };
    return {
      remainingDays: dayjs(expiry).diff(dayjs(), "day"),
      isTrial: type === SUBSCRIPTION_STATUS.TRIAL,
      isBasic: type === SUBSCRIPTION_STATUS.BASIC,
      isBeta: type === SUBSCRIPTION_STATUS.BETA,
      isPro: type === SUBSCRIPTION_STATUS.PREMIUM,
      isProCancelled: type === SUBSCRIPTION_STATUS.PREMIUM_CANCELED,
      isProExpired: type === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED
    };
  }, [user]);

  const subtitle = useMemo(() => {
    const expiryDate = dayjs(user?.subscription?.expiry).format("MMMM D, YYYY");
    const startDate = dayjs(user?.subscription?.start).format("MMMM D, YYYY");
    return isPro
      ? `Your subscription will auto renew on ${expiryDate}.`
      : isProCancelled
      ? `Your subscription will end on ${expiryDate}.`
      : isProExpired
      ? "Your account will be downgraded to Basic in 3 days."
      : isBeta
      ? `Your were enrolled in our beta program on ${startDate}`
      : isTrial
      ? `Your trial will end on ${expiryDate}`
      : null;
  }, [isPro, isProExpired, isProCancelled, isBeta, isTrial, user]);

  const provider = useMemo(() => {
    const provider = user?.subscription?.provider;
    switch (provider) {
      default:
      case 0:
        return "Streetwriters";
      case 1:
        return "iOS";
      case 2:
        return "Android";
      case 3:
        return "Web";
    }
  }, [user]);

  return (
    <AccountStatusContainer user={user} color={"fontTertiary"}>
      <Text
        variant="body"
        sx={{
          fontSize: "heading",
          color: remainingDays <= 5 ? "error" : "text"
        }}
      >
        {remainingDays > 0 && isPro
          ? `Subscribed to Notesnook Pro`
          : remainingDays > 0 && isTrial
          ? "You are on free trial"
          : isBeta
          ? "Your beta subscription has ended"
          : isTrial
          ? "Your trial has ended"
          : isPro
          ? "Your Notesnook Pro subscription has ended"
          : ""}
      </Text>
      {subtitle && <Text variant="subBody">{subtitle}</Text>}
      {isBasic ||
      isTrial ||
      isProExpired ||
      isProCancelled ||
      remainingDays <= 0 ? (
        <Button
          variant="primary"
          bg={user.isEmailConfirmed ? "primary" : "error"}
          mt={1}
          onClick={() => {
            if (user.isEmailConfirmed)
              showBuyDialog(undefined, isTrial ? "TRIAL2PRO" : undefined);
            else showEmailVerificationDialog();
          }}
        >
          {isProCancelled
            ? "Resubscribe to Notesnook Pro"
            : isTrial
            ? "Upgrade at 50% OFF"
            : user.isEmailConfirmed
            ? "Upgrade to Notesnook Pro"
            : "Confirm your email to sync your notes."}
        </Button>
      ) : provider === "Streetwriters" ? (
        <>
          <Text
            variant="subBody"
            mt={1}
            px={"4px"}
            py={"2px"}
            sx={{
              borderRadius: "default",
              color: "primary",
              alignSelf: "flex-end"
            }}
          >
            Awarded by {provider}
          </Text>
        </>
      ) : isPro ? (
        <>
          <Button
            variant="list"
            onClick={async () => {
              if (!user.subscription.updateURL)
                return showToast(
                  "error",
                  "Failed to update. Please reach out to us at support@streetwriters.co so we can help you resolve the issue."
                );
              window.open(user.subscription.updateURL, "_blank");
            }}
          >
            <Tip
              text="Update payment method"
              tip="Update the payment method you used to purchase this subscription."
            />
          </Button>
          <Button
            variant="list"
            sx={{ ":hover": { borderColor: "error" } }}
            onClick={async () => {
              if (!user.subscription.cancelURL)
                return showToast(
                  "error",
                  "Failed to cancel subscription. Please reach out to us at support@streetwriters.co so we can help you resolve the issue."
                );
              window.open(user.subscription.cancelURL, "_blank");
            }}
          >
            <Tip
              color="error"
              text="Cancel subscription"
              tip="You will be downgraded to the Basic plan at the end of your billing period."
            />
          </Button>
          <Text
            variant="subBody"
            mt={1}
            px={"4px"}
            py={"2px"}
            sx={{
              borderRadius: "default",
              color: "primary",
              alignSelf: "flex-end"
            }}
          >
            Purchased on {provider}
          </Text>
        </>
      ) : null}
    </AccountStatusContainer>
  );
}

function AccountStatusContainer(props) {
  const { bg, color, user, children } = props;
  return (
    <Flex
      bg={bg}
      p={2}
      mt={1}
      sx={{
        borderRadius: "default",
        border: "1px solid var(--border)",
        flexDirection: "column"
      }}
      data-test-id="account-status"
    >
      <Flex sx={{ flex: "1", justifyContent: "space-between" }}>
        <Flex>
          <Icon.User size={15} color={color} />
          <Text variant="body" ml={1} sx={{ color: color }}>
            {user.email}
          </Text>
        </Flex>
        <Text
          variant="subBody"
          px={"2px"}
          py={"1px"}
          sx={{ borderRadius: "default", color: color }}
          bg={bg}
        >
          {subscriptionStatusToString(user)}
        </Text>
      </Flex>
      {children}
    </Flex>
  );
}

function Header(props) {
  const { title, isOpen, testId, onClick } = props;
  return (
    <Flex
      data-test-id={testId}
      sx={{
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        justifyContent: "space-between"
      }}
      // mt={2}
      py={2}
      onClick={onClick}
    >
      <Text
        variant="subtitle"
        sx={{
          fontWeight: isOpen ? "bold" : "body",
          color: isOpen ? "primary" : "fontTertiary"
        }}
      >
        {title}
      </Text>
      {isOpen ? (
        <Icon.ChevronUp size={19} color="primary" />
      ) : (
        <Icon.ChevronDown size={19} color="fontTertiary" />
      )}
    </Flex>
  );
}
