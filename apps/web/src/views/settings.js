import React, { useEffect, useMemo, useState } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import { useStore as useAppStore } from "../stores/app-store";
import AccentItem from "../components/accent-item";
import accents from "../theme/accents";
import { confirm } from "../common/dialog-controller";
import { showLogoutConfirmation } from "../common/dialog-controller";
import useSystemTheme from "../utils/use-system-theme";
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
import { hashNavigate } from "../navigation";
import useVersion from "../utils/useVersion";
import { CHECK_IDS } from "notes-core/common";
import { openPaddleDialog } from "../common/checkout";
import Tip from "../components/tip";
import Toggle from "../components/toggle";
import openLink from "../commands/openLink";
import { isDesktop } from "../utils/platform";
import Vault from "../common/vault";
import { isUserPremium } from "../hooks/use-is-user-premium";

function importBackup() {
  return new Promise((resolve, reject) => {
    const importFileElem = document.getElementById("restore-backup");
    importFileElem.click();
    importFileElem.onchange = function () {
      const file = importFileElem.files[0];
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
    description: "Facing an issue? Report it on our Github Repo.",
    link: "https://github.com/streetwriters/notesnook/issues/new",
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
    privacy: false,
    other: true,
  });
  const isSystemThemeDark = useSystemTheme();
  const isVaultCreated = useAppStore((store) => store.isVaultCreated);
  const setIsVaultCreated = useAppStore((store) => store.setIsVaultCreated);
  const refreshApp = useAppStore((store) => store.refresh);
  const refreshNotes = useNoteStore((store) => store.refresh);
  const sync = useAppStore((store) => store.sync);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const setTheme = useThemeStore((store) => store.setTheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);
  const [, version] = useVersion();

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
  const [enableTelemetry, setEnableTelemetry] = usePersistentState(
    "telemetry",
    true
  );

  useEffect(() => {
    if (!followSystemTheme) return;
    setTheme(isSystemThemeDark ? "dark" : "light");
  }, [followSystemTheme, isSystemThemeDark, setTheme]);

  return (
    <ScrollContainer>
      <Flex variant="columnFill" px={2}>
        {isLoggedIn ? (
          <AccountStatus user={user} />
        ) : (
          <Flex
            p={1}
            sx={{ borderRadius: "default", cursor: "pointer" }}
            onClick={async () => {
              
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
              onClick={async () => {
                const result = await showPasswordDialog(
                  "change_account_password",
                  (data) => {
                    return db.user.resetPassword(
                      data.oldPassword,
                      data.newPassword
                    );
                  }
                );
                if (result) {
                  await showToast("success", "Account password changed!");
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
              variant="list"
              onClick={async () => {
                if (await showLogoutConfirmation()) {
                  await showLoadingDialog({
                    title: "Logging you out",
                    subtitle: "We are logging you out. Please wait...",
                    action: async () => {
                      await db.user.logout(true);
                    },
                    message: (
                      <Text color="error">
                        Please do NOT close your browser or shut down your PC.
                      </Text>
                    ),
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
              onTip="Switch app theme according to system"
              offTip="Keep app theme independent"
              premium="customize"
              onToggled={toggleFollowSystemTheme}
              isToggled={followSystemTheme}
            />
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
                  const backupData = JSON.stringify(await importBackup());
                  const error = await showLoadingDialog({
                    title: "Restoring backup",
                    subtitle: "We are restoring your backup. Please wait...",
                    action: async () => {
                      await db.backup.import(backupData);
                    },
                    message: (
                      <Text color="error">
                        Please do NOT close your browser or shut down your PC.
                      </Text>
                    ),
                  });
                  if (!error) {
                    await showToast("success", "Backup restored!");
                    await refreshApp();
                  } else {
                    throw new Error(error);
                  }
                } catch (e) {
                  await showToast(
                    "error",
                    `Could not restore the backup. Error message: ${
                      e.message || e
                    }`
                  );
                }
              }}
            >
              <Tip
                text="Restore backup"
                tip="Restore data from a backup file"
              />
            </Button>
            <Button
              key={"importer"}
              variant="list"
              onClick={() => {
                openLink("https://importer.notesnook.com/", "_blank");
              }}
            >
              <Tip
                text={"Import from other apps"}
                tip={
                  "Import all your notes from other note taking apps with Notesnook Importer."
                }
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
            <Button
              variant="list"
              onClick={() => {
                const details = [
                  "1. We send an event whenever you open the web app along with the app version. All further navigation is not recorded.",
                  "2. We send an event when you click the CTA (Call to Action) button on an announcement or promo.",
                  "3. We send an event when you open the checkout to buy Notesnook Pro.",
                  "4. We send an event when you claim an offer or promo.",
                ];
                confirm({
                  title: "Telemetry details",
                  subtitle:
                    "Read details of all the usage data we collect and send to our servers.",
                  message: (
                    <>
                      {details.map((detail) => (
                        <p>{detail}</p>
                      ))}
                    </>
                  ),
                  yesText: "Okay",
                });
              }}
            >
              <Tip
                text="What do we collect?"
                tip="Read details of all usage data we collect."
              />
            </Button>
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
                  openLink(item.link, "_blank");
                }}
              >
                <Tip text={item.title} tip={item.description} />
              </Button>
            ))}
            <Tip
              sx={{ mt: 2 }}
              text="About"
              tip={`version ${version.formatted}`}
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
    remainingHours,
  } = useMemo(() => {
    const type = user?.subscription?.type;
    const expiry = user?.subscription?.expiry;
    if (!type || !expiry) return { isBasic: true };
    return {
      remainingDays: dayjs(expiry).diff(dayjs(), "day"),
      remainingHours: dayjs(expiry).diff(dayjs(), "hours"),
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
      ? `Your trial period started on ${startDate}`
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

  if (!user.isEmailConfirmed)
    return (
      <AccountStatusContainer user={user} bg={"errorBg"} color={"error"}>
        <Button mt={2} bg="error" onClick={() => hashNavigate("/email/verify")}>
          <Flex alignItems="center">
            <Icon.Warn color="static" size={13} />
            <Text color="static" ml={1}>
              Please verify your email.
            </Text>
          </Flex>
        </Button>
      </AccountStatusContainer>
    );

  return (
    <AccountStatusContainer
      user={user}
      color={"primary"}
      sx={{ borderWidth: 1, borderColor: "primary", borderStyle: "solid" }}
    >
      <Text
        color={remainingDays <= 5 ? "error" : "primary"}
        variant="body"
        fontSize={26}
        mt={2}
      >
        {remainingDays === 0
          ? `${remainingHours} hours remaining`
          : remainingDays > 0
          ? `${remainingDays} days remaining`
          : isBeta
          ? "Your beta subscription has ended."
          : isTrial
          ? "Your trial has ended."
          : isPro
          ? "Your premium subscription has ended."
          : ""}
      </Text>
      {subtitle && <Text variant="subBody">{subtitle}</Text>}
      {isBasic || isTrial || remainingDays <= 0 ? (
        <Button mt={2} onClick={() => showBuyDialog()}>
          Upgrade to Notesnook Pro
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
  const { bg, color, user, sx, children } = props;
  return (
    <Flex
      bg={bg}
      flexDirection="column"
      p={2}
      sx={{ borderRadius: "default", ...sx }}
    >
      <Flex flex="1" justifyContent="space-between">
        <Flex>
          <Icon.User size={15} color={color} />
          <Text variant="body" color="text" ml={1}>
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
  const { title, isOpen, onClick } = props;
  return (
    <Flex
      sx={{ borderRadius: "default", cursor: "pointer" }}
      bg="bgSecondary"
      mt={2}
      p={2}
      justifyContent="space-between"
      onClick={onClick}
    >
      <Text
        variant="subtitle"
        fontWeight="body"
        color={isOpen ? "primary" : "text"}
      >
        {title}
      </Text>
      {isOpen ? (
        <Icon.ChevronUp size={19} color="primary" />
      ) : (
        <Icon.ChevronDown size={19} />
      )}
    </Flex>
  );
}
