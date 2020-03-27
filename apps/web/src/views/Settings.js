import React, { useEffect } from "react";
import { Box, Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import "../app.css";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useThemeStore } from "../stores/theme-store";

function Settings(props) {
  const theme = useThemeStore(store => store.theme);
  const accent = useThemeStore(store => store.accent);
  const toggleNightMode = useThemeStore(store => store.toggleNightMode);
  const setAccent = useThemeStore(store => store.theme);
  const user = useUserStore(store => store.user);
  const isLoggedIn = useUserStore(store => store.isLoggedIn);

  return (
    <Flex variant="columnFill">
      <Flex
        bg="shade"
        mx={2}
        p={2}
        sx={{ borderRadius: "default", cursor: "pointer" }}
        onClick={() => props.navigator.navigate("account")}
      >
        <Flex
          variant="columnCenter"
          bg="primary"
          mr={2}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 80
          }}
        >
          <Icon.User color="static" />
        </Flex>
        <Flex variant="columnCenter">
          {isLoggedIn ? (
            <>
              <Text variant="title">{user.username}</Text>
              <Text fontSize="subBody">{user.email}</Text>
            </>
          ) : (
            <>
              <Text fontSize="subBody" color="gray">
                You are not logged in
              </Text>
              <Text fontSize="body" color="primary">
                Login to sync notes.
              </Text>
            </>
          )}
        </Flex>
      </Flex>
      <Box
        px={2}
        mt={2}
        fontSize="subtitle"
        fontFamily="heading"
        fontWeight="bold"
        color="primary"
      >
        Appearance
      </Box>
      <Box
        sx={{
          borderBottom: "1px Solid",
          borderColor: "border",
          "&:hover": { borderColor: "primary" }
        }}
        py={2}
      >
        <Flex
          flexWrap="wrap"
          sx={{
            marginBottom: 2,
            borderRadius: "default"
          }}
          justifyContent="left"
          mx={2}
          bg="shade"
          p={1}
        >
          {[
            { label: "red", code: "#ed2d37" },
            { label: "orange", code: "#ec6e05" },
            { label: "yellow", code: "yellow" },
            { label: "green", code: "green" },
            { label: "blue", code: "blue" },
            { label: "purple", code: "purple" },
            { label: "gray", code: "gray" },
            { label: "lightblue", code: "#46F0F0" },
            { label: "indigo", code: "#F032E6" },
            { label: "lightpink", code: "#FABEBE" }
          ].map(color => (
            <Flex
              variant="rowCenter"
              sx={{ position: "relative" }}
              onClick={() => {
                setAccent(color.code);
              }}
            >
              {color.code === accent && (
                <Icon.Checkmark
                  sx={{
                    position: "absolute",
                    cursor: "pointer"
                  }}
                  color="static"
                  size={20}
                />
              )}
              <Icon.Circle
                size={40}
                sx={{ cursor: "pointer" }}
                color={color.code}
              />
            </Flex>
          ))}
        </Flex>
        <Flex
          flexDirection="row"
          px={2}
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleNightMode()}
        >
          <Text fontSize="body">Dark Mode</Text>
          {theme === "dark" ? <Icon.Check /> : <Icon.CircleEmpty />}
        </Flex>
      </Box>
      <Box
        px={2}
        mt={2}
        fontSize="subtitle"
        fontFamily="heading"
        fontWeight="bold"
        color="primary"
      >
        Other
      </Box>
      <Button
        variant="setting"
        onClick={() => {
          props.navigator.navigate("TOS", {
            title: Titles.TOS
          });
        }}
      >
        {Titles.TOS}
      </Button>
      <Button
        variant="setting"
        onClick={() => {
          props.navigator.navigate("privacy", {
            title: Titles.privacy
          });
        }}
      >
        {Titles.privacy}
      </Button>
      <Button
        variant="setting"
        onClick={() => {
          props.navigator.navigate("about", {
            title: Titles.about
          });
        }}
      >
        {Titles.about}
      </Button>
    </Flex>
  );
}

function SettingsContainer() {
  useEffect(() => {
    const SettingsNavigator = require("../navigation/navigators/settingnavigator")
      .default;
    if (!SettingsNavigator.restore()) {
      SettingsNavigator.navigate("settings");
    }
  }, []);
  return <Flex variant="columnFill" className="SettingsNavigator" />;
}

const Titles = {
  general: "General",
  account: "Account",
  accent: "Accent Color",
  TOS: "Terms of Service",
  privacy: "Privacy Policy",
  about: "About"
};

export { Settings, SettingsContainer };
