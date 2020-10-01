import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import AccentItem from "../components/accent-item";
import accents from "../theme/accents";
import { showLogInDialog } from "../components/dialogs/logindialog";
import { upgrade } from "../common/upgrade";
import useSystemTheme from "../utils/use-system-theme";

function Settings(props) {
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const setTheme = useThemeStore((store) => store.setTheme);

  const preferSystemTheme = useThemeStore((store) => store.preferSystemTheme);
  const togglePreferSystemTheme = useThemeStore(
    (store) => store.togglePreferSystemTheme
  );
  const user = useUserStore((store) => store.user);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const isTrial = useUserStore(
    (store) => store?.user?.notesnook?.subscription?.isTrial
  );
  const logout = useUserStore((store) => store.logout);

  const isSystemThemeDark = useSystemTheme();
  useEffect(() => {
    if (!preferSystemTheme) return;
    setTheme(isSystemThemeDark ? "dark" : "light");
  }, [preferSystemTheme, isSystemThemeDark, setTheme]);

  return (
    <Flex variant="columnFill" px={2} sx={{ overflowY: "auto" }}>
      {isLoggedIn && (
        <Text mb={2} variant="subtitle" color="primary">
          Account Settings
        </Text>
      )}
      <Flex
        bg="shade"
        p={2}
        sx={{ borderRadius: "default", cursor: "pointer" }}
        onClick={async () => {
          if (!isLoggedIn) {
            await showLogInDialog();
          } else {
            upgrade(user);
          }
          // TODO open buy premium dialog
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
              {isLoggedIn ? (
                <>
                  <Text variant="subtitle">{user.username}</Text>
                  <Text variant="subBody">{user.email}</Text>
                </>
              ) : (
                <>
                  <Text variant="subBody">You are not logged in</Text>
                  <Text variant="body" color="primary" fontSize={14}>
                    Login to sync your notes
                  </Text>
                </>
              )}
            </Flex>
          </Flex>
          {isLoggedIn ? (
            <Text
              bg="primary"
              sx={{ borderRadius: "default" }}
              color="static"
              fontSize="body"
              px={1}
              py={1 / 2}
            >
              {!isTrial ? "Pro" : "Trial"}
            </Text>
          ) : (
            <Icon.ChevronRight size={20} color="primary" />
          )}
        </Flex>
      </Flex>
      {isLoggedIn && (
        <Button
          variant="list"
          onClick={async () => {
            await logout();
          }}
        >
          Logout
        </Button>
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
        onlyIf={!preferSystemTheme}
      />
      <ToggleItem
        title="Follow system theme"
        onTip="Switch app theme according to system"
        offTip="Keep app theme independent"
        onToggled={togglePreferSystemTheme}
        isToggled={preferSystemTheme}
      />

      <Text
        variant="subtitle"
        color="primary"
        sx={{ pb: 1, borderBottom: "1px solid", borderBottomColor: "border" }}
      >
        {"Backup & Restore"}
      </Text>
      <Button variant="list">
        <TextWithTip text="Backup data" tip="Download all your data" />
      </Button>
      <Button variant="list">
        <TextWithTip
          text="Restore backup"
          tip="Restore data from a backup file"
        />
      </Button>

      <ToggleItem
        title="Encrypt backups"
        onTip="All backups will be encrypted"
        offTip="Backups will not be encrypted"
      />

      <Text
        variant="subtitle"
        color="primary"
        sx={{ pb: 1, borderBottom: "1px solid", borderBottomColor: "border" }}
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
