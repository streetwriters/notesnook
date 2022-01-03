import { useMemo, useState } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import { useStore as useAppStore } from "../stores/app-store";
import AccentItem from "../components/accent-item";
import accents from "../theme/accents";
import {
  showEmailVerificationDialog,
  showImportDialog,
  showIssueDialog,
  showTrackingDetailsDialog,
} from "../common/dialog-controller";
import { showLogoutConfirmation } from "../common/dialog-controller";
import { createBackup, SUBSCRIPTION_STATUS, verifyAccount } from "../common";
import { db } from "../common/db";
import { usePersistentState } from "../utils/hooks";
import dayjs from "dayjs";
import { showRecoveryKeyDialog } from "../common/dialog-controller";
import { showBuyDialog } from "../common/dialog-controller";
import ScrollContainer from "../components/scroll-container";
import { showLoadingDialog } from "../common/dialog-controller";
import { showToast } from "../utils/toast";
import { showPasswordDialog } from "../common/dialog-controller";
import { hardNavigate, hashNavigate } from "../navigation";
import { appVersion } from "../utils/version";
import { CHECK_IDS } from "notes-core/common";
import { openPaddleDialog } from "../common/checkout";
import Tip from "../components/tip";
import Toggle from "../components/toggle";
import { isDesktop } from "../utils/platform";
import Vault from "../common/vault";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { Slider } from "@rebass/forms";
import useZoomFactor from "../hooks/use-zoom-factor";
import debounce from "just-debounce-it";
import { PATHS } from "@notesnook/desktop/paths";
import { openPath } from "../commands/open";

function importBackup() {
  return new Promise((resolve, reject) => {
    const importFileElem = document.getElementById("restore-backup");
    importFileElem.click();
    importFileElem.onchange = function () {
      const file = importFileElem.files[0];
      if (!file) return reject("No file selected.");
      if (!file.name.endsWith(".nnbackup")) {
        return reject(
          "The given file does not have .nnbackup extension. Only files with .nnbackup extension are supported."
        );
      }
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        const text = event.target.result;
        try {
          resolve(JSON.parse(text));
        } catch (e) {
          alert(
            "Error: Could not read the backup file provided. Either it's corrupted or invalid."
          );
          resolve();
        }
      });
      reader.readAsText(file);
    };
  });
}

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
    link: "https://notesnook.com/tos",
  },
  {
    title: "Privacy policy",
    description:
      "We do not share, sell, read, or use your data. Read our privacy policy.",
    link: "https://notesnook.com/privacy",
  },
  {
    title: "Report an issue",
    description: "Facing an issue? Click here to create a bug report.",
    onClick: () => showIssueDialog(),
  },
  {
    title: "Join our Discord community",
    description:
      "We are not ghosts. Come chat with us and share your experience.",
    link: "https://discord.com/invite/zQBK97EE22",
  },
  {
    title: "Download for iOS & Android",
    description: "Notesnook is available on Android & iOS",
    link: "https://notesnook.com/",
  },
  {
    title: "Documentation",
    description: "Learn about every feature in Notesnook and how it works",
    link: "https://docs.notesnook.com/",
  },
  {
    title: "Roadmap",
    description: "See what the future of Notesnook is going to be like!",
    link: "https://docs.notesnook.com/roadmap",
  },
];

function Settings(props) {
  const [groups, setGroups] = useState({
    appearance: false,
    backup: false,
    importer: false,
    privacy: false,
    developer: false,
    other: true,
  });
  const isVaultCreated = useAppStore((store) => store.isVaultCreated);
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
  const encryptBackups = useSettingStore((store) => store.encryptBackups);
  const toggleEncryptBackups = useSettingStore(
    (store) => store.toggleEncryptBackups
  );
  const user = useUserStore((store) => store.user);
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
  const [enableTelemetry, setEnableTelemetry] = usePersistentState(
    "telemetry",
    true
  );

  return (
    <ScrollContainer>
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
              flex="1 1 auto"
              justifyContent="space-between"
              alignItems="center"
            >
              <Flex>
                <Flex
                  variant="columnCenter"
                  bg="shade"
                  mr={2}
                  size={35}
                  sx={{
                    borderRadius: 80,
                  }}
                >
                  <Icon.User size={20} color="primary" />
                </Flex>
                <Flex variant="columnCenter" alignItems="flex-start">
                  <Text variant="subBody">You are not logged in</Text>
                  <Text variant="body" fontSize={"body"}>
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
              data-test-id="settings-change-password"
              onClick={async () => {
                const result = await showPasswordDialog(
                  "change_account_password",
                  (data) => {
                    return db.user.changePassword(
                      data.oldPassword,
                      data.newPassword
                    );
                  }
                );
                if (result) {
                  await showToast("success", "Account password changed!");
                  await db.user.clearSessions();
                }
              }}
            >
              <Tip
                text="Change account password"
                tip="Set a new password for your account"
              />
            </Button>
            <Button variant="list" onClick={() => sync(true, true)}>
              <Tip
                text="Having problems with syncing?"
                tip="Try force sync to resolve issues with syncing"
              />
            </Button>
            <Button
              data-test-id="settings-logout"
              variant="list"
              onClick={async () => {
                if (await showLogoutConfirmation()) {
                  await showLoadingDialog({
                    title: "You are being logged out",
                    action: () => db.user.logout(true),
                  });
                  showToast("success", "You have been logged out.");
                }
              }}
            >
              <Tip
                text="Logout"
                tip="Log out of your account and clear all data."
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
              sx={{ ":hover": { borderColor: "error" } }}
              bg="errorBg"
              mx={-2}
              px={2}
            >
              <Tip
                color="error"
                text="Delete account"
                tip="Permanently delete account and logout from all devices."
              />
            </Button>
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
              flexWrap="wrap"
              justifyContent="left"
              sx={{
                borderRadius: "default",
              }}
            >
              {accents.map((color) => (
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
              premium="customize"
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
          title="Backup & restore"
          isOpen={groups.backup}
          onClick={() => {
            setGroups((g) => ({ ...g, backup: !g.backup }));
          }}
        />
        {groups.backup && (
          <>
            <Button
              variant="list"
              onClick={async () => {
                if (await verifyAccount()) await createBackup();
              }}
            >
              <Tip
                text="Backup data"
                tip="Create a backup file of all your data"
              />
            </Button>
            <input
              type="file"
              id="restore-backup"
              hidden
              accept=".nnbackup,text/plain,application/json"
            />
            <Button
              variant="list"
              onClick={async () => {
                try {
                  if (!isLoggedIn)
                    throw new Error(
                      "You must be logged in to restore backups."
                    );

                  const backupData = JSON.stringify(await importBackup());
                  const error = await showLoadingDialog({
                    title: "Restoring backup",
                    subtitle:
                      "Please do NOT close your browser or shut down your PC.",
                    action: () => db.backup.import(backupData),
                  });
                  if (!error) {
                    await showToast("success", "Backup restored!");
                    await refreshApp();
                  } else {
                    throw new Error(error);
                  }
                } catch (e) {
                  console.error(e);
                  await showToast(
                    "error",
                    `Could not restore the backup: ${e.message || e}`
                  );
                }
              }}
            >
              <Tip
                text="Restore backup"
                tip="Restore data from a backup file"
              />
            </Button>
            <Toggle
              title="Encrypt backups"
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
              onSelectionChanged={(_option, index) =>
                setBackupReminderOffset(index)
              }
            />
            {isDesktop() && !!backupReminderOffset ? (
              <Button
                key={"backupLocation"}
                variant="list"
                onClick={async () => {
                  const location = await window.native.selectDirectory({
                    title: "Select where Notesnook should save backups",
                    defaultPath:
                      backupStorageLocation || PATHS.backupsDirectory,
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
            <Toggle
              title="Enable telemetry"
              onTip="Usage data & crash reports will be sent to us (no 3rd party involved) for analytics. All data is anonymous as mentioned in our privacy policy."
              offTip="Do not collect any data or crash reports"
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
      </Flex>
    </ScrollContainer>
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
    premium,
  } = props;

  if (onlyIf === false) return null;
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      py={2}
      sx={{
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        ":hover": { borderBottomColor: "primary" },
      }}
    >
      <Tip text={title} tip={tip} />
      <Flex
        justifyContent="space-evenly"
        mt={2}
        bg="border"
        sx={{ borderRadius: "default", overflow: "hidden" }}
      >
        {options.map((option, index) => (
          <Text
            key={option}
            flex={1}
            bg={selectedOption === index ? "primary" : "transparent"}
            color={selectedOption === index ? "static" : "gray"}
            textAlign="center"
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
    remainingDays,
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
      isProExpired: type === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED,
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
        color={remainingDays <= 5 ? "error" : "text"}
        variant="body"
        fontSize={"heading"}
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
          mt={1}
          onClick={() => {
            if (user.isEmailConfirmed) showBuyDialog();
            else showEmailVerificationDialog();
          }}
        >
          {user.isEmailConfirmed
            ? "Upgrade to Notesnook Pro"
            : "Confirm your email to get 7 more days"}
        </Button>
      ) : provider === "Streetwriters" ? (
        <>
          <Text
            variant="subBody"
            mt={1}
            px={"4px"}
            py={"2px"}
            alignSelf="flex-end"
            sx={{ borderRadius: "default" }}
            color={"primary"}
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
              await openPaddleDialog(user.subscription.updateURL);
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
              await openPaddleDialog(user.subscription.cancelURL);
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
            alignSelf="flex-end"
            sx={{ borderRadius: "default" }}
            color={"primary"}
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
      flexDirection="column"
      p={2}
      sx={{ borderRadius: "default", border: "1px solid var(--border)" }}
    >
      <Flex flex="1" justifyContent="space-between">
        <Flex>
          <Icon.User size={15} color={color} />
          <Text color={color} variant="body" ml={1}>
            {user.email}
          </Text>
        </Flex>
        <Text
          variant="subBody"
          px={"2px"}
          py={"1px"}
          sx={{ borderRadius: "default" }}
          bg={bg}
          color={color}
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
      sx={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
      // mt={2}
      py={2}
      justifyContent="space-between"
      onClick={onClick}
    >
      <Text
        variant="subtitle"
        fontWeight={isOpen ? "bold" : "body"}
        color={isOpen ? "primary" : "fontTertiary"}
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
