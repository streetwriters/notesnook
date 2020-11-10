import React, { useEffect, useMemo } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import AccentItem from "../components/accent-item";
import accents from "../theme/accents";
import { showLogInDialog } from "../components/dialogs/logindialog";
import { showLogoutConfirmation } from "../components/dialogs/confirm";
import useSystemTheme from "../utils/use-system-theme";
import download from "../utils/download";
import { db, SUBSCRIPTION_STATUS } from "../common";
import { usePersistentState } from "../utils/hooks";
import dayjs from "dayjs";
import { showRecoveryKeyDialog } from "../components/dialogs/recoverykeydialog";
import { showBuyDialog } from "../components/dialogs/buy-dialog";

function importBackup() {
  return new Promise((resolve, reject) => {
    const importFileElem = document.getElementById("restore-backup");
    importFileElem.click();
    importFileElem.onchange = function () {
      const file = importFileElem.files[0];
      if (!file.name.endsWith(".nnbackup")) {
        alert(
          "Invalid backup file provided. Make sure it has an .nnbackup extension."
        );
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

function Settings(props) {
  const isSystemThemeDark = useSystemTheme();
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const setTheme = useThemeStore((store) => store.setTheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);
  const toggleFollowSystemTheme = useThemeStore(
    (store) => store.toggleFollowSystemTheme
  );
  const encryptBackups = useSettingStore((store) => store.encryptBackups);
  const toggleEncryptBackups = useSettingStore(
    (store) => store.toggleEncryptBackups
  );
  const user = useUserStore((store) => store.user);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const logout = useUserStore((store) => store.logout);
  const [backupReminderOffset, setBackupReminderOffset] = usePersistentState(
    "backupReminderOffset",
    0
  );

  const subscriptionDaysRemaining = useMemo(
    () => dayjs(user?.subscription?.expiry).diff(dayjs(), "day") + 1,
    [user]
  );
  const isTrial = useMemo(
    () => user?.subscription?.status === SUBSCRIPTION_STATUS.TRIAL,
    [user]
  );

  useEffect(() => {
    if (!followSystemTheme) return;
    setTheme(isSystemThemeDark ? "dark" : "light");
  }, [followSystemTheme, isSystemThemeDark, setTheme]);

  return (
    <Flex variant="columnFill" px={2} sx={{ overflowY: "auto" }}>
      {isLoggedIn ? (
        <Flex
          bg="shade"
          flexDirection="column"
          p={2}
          sx={{ borderRadius: "default" }}
        >
          <Flex flex="1" justifyContent="space-between">
            <Flex>
              <Icon.User size={15} color="primary" />
              <Text variant="body" color="text" ml={1}>
                {user.username}
              </Text>
            </Flex>
            <Text
              variant="subBody"
              px={"2px"}
              py={"1px"}
              sx={{ borderRadius: "default" }}
              bg="static"
              color="primary"
            >
              {isTrial ? "Trial" : "Pro"}
            </Text>
          </Flex>
          <Text
            color={subscriptionDaysRemaining <= 5 ? "error" : "primary"}
            variant="body"
            fontSize={26}
            mt={2}
          >
            {subscriptionDaysRemaining} Days Remaining
          </Text>
          <Text variant="subBody">
            Your trial period started on{" "}
            {dayjs(user.subscription.start).format("MMMM D, YYYY")}
          </Text>
          {isTrial && (
            <Button mt={2} onClick={showBuyDialog}>
              Upgrade to Notesnook Pro
            </Button>
          )}
        </Flex>
      ) : (
        <Flex
          bg="shade"
          p={2}
          sx={{ borderRadius: "default", cursor: "pointer" }}
          onClick={async () => {
            await showLogInDialog();
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
                bg="primary"
                mr={2}
                size={35}
                sx={{
                  borderRadius: 80,
                }}
              >
                <Icon.User size={20} color="static" />
              </Flex>
              <Flex variant="columnCenter" alignItems="flex-start">
                <Text variant="subBody">You are not logged in</Text>
                <Text variant="body" color="primary" fontSize={14}>
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
          <Button variant="list" onClick={showRecoveryKeyDialog}>
            <TextWithTip
              text="Backup data recovery key"
              tip="In case you lose your password, you can recover your data using your recovery key."
            />
          </Button>
          <Button
            variant="list"
            onClick={async () => {
              if (await showLogoutConfirmation()) await logout();
            }}
          >
            <TextWithTip
              text="Logout"
              tip="Log out of your account and clear all data."
            />
          </Button>
        </>
      )}
      <Text
        variant="subtitle"
        color="primary"
        py={1}
        sx={{ borderBottom: "1px solid", borderBottomColor: "border" }}
      >
        Appearance
      </Text>
      <TextWithTip
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
          <AccentItem key={color.code} code={color.code} label={color.label} />
        ))}
      </Flex>
      <ToggleItem
        title="Dark mode"
        onTip="Dark mode is on"
        offTip="Dark mode is off"
        onToggled={toggleNightMode}
        isToggled={theme === "dark"}
        onlyIf={!followSystemTheme}
      />
      <ToggleItem
        title="Follow system theme"
        onTip="Switch app theme according to system"
        offTip="Keep app theme independent"
        onToggled={toggleFollowSystemTheme}
        isToggled={followSystemTheme}
      />

      <Text
        variant="subtitle"
        color="primary"
        sx={{ py: 1, borderBottom: "1px solid", borderBottomColor: "border" }}
      >
        {"Backup & Restore"}
      </Text>
      <Button
        variant="list"
        onClick={async () => {
          download(
            `notesnook-backup-${new Date().toLocaleString("en")}`,
            await db.backup.export("web", encryptBackups),
            "nnbackup"
          );
        }}
      >
        <TextWithTip
          text="Backup data"
          tip="Backup and download all your data"
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
          await db.backup.import(JSON.stringify(await importBackup()));
        }}
      >
        <TextWithTip
          text="Restore backup"
          tip="Restore data from a backup file"
        />
      </Button>

      <ToggleItem
        title="Encrypt backups"
        onTip="All backups will be encrypted"
        offTip="Backups will not be encrypted"
        onToggled={toggleEncryptBackups}
        isToggled={encryptBackups}
      />

      <OptionsItem
        title="Backup reminders"
        tip="Remind me to backup my data"
        options={["Never", "Daily", "Weekly", "Monthly"]}
        selectedOption={backupReminderOffset}
        onSelectionChanged={(_option, index) => setBackupReminderOffset(index)}
      />

      <Text
        variant="subtitle"
        color="primary"
        sx={{ py: 1, borderBottom: "1px solid", borderBottomColor: "border" }}
      >
        Other
      </Text>
      {["Terms of Service", "Privacy Policy", "About"].map((title) => (
        <Button
          key={title}
          variant="list"
          onClick={() =>
            props.navigator.navigate("TOS", {
              title,
            })
          }
        >
          {title}
        </Button>
      ))}
    </Flex>
  );
}

export default Settings;

function TextWithTip({ text, tip, sx }) {
  return (
    <Text color="text" fontSize="body" sx={sx}>
      {text}
      <Text color="fontTertiary" fontSize="subBody">
        {tip}
      </Text>
    </Text>
  );
}

function ToggleItem(props) {
  const { title, onTip, offTip, isToggled, onToggled, onlyIf } = props;

  if (onlyIf === false) return null;
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      onClick={onToggled}
      py={2}
      sx={{
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        ":hover": { borderBottomColor: "primary" },
      }}
    >
      <TextWithTip text={title} tip={isToggled ? onTip : offTip} />
      {isToggled ? (
        <Icon.ToggleChecked size={30} color="primary" />
      ) : (
        <Icon.ToggleUnchecked size={30} />
      )}
    </Flex>
  );
}

function OptionsItem(props) {
  const {
    title,
    tip,
    options,
    selectedOption,
    onSelectionChanged,
    onlyIf,
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
      <TextWithTip text={title} tip={tip} />
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
            onClick={() => onSelectionChanged(option, index)}
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
