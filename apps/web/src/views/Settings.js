import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import "../app.css";
import { changeTheme, isDarkTheme, changeAccent } from "../utils/theme";
import { useTheme } from "emotion-theming";
import { useStore as useUserStore } from "../stores/user-store";

const Settings = props => {
  const [check, setCheck] = useState(isDarkTheme());
  const theme = useTheme();
  const user = useUserStore(store => store.user);
  const isLoggedIn = useUserStore(store => store.isLoggedIn);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex
        flexDirection="row"
        bg="shade"
        mx={2}
        p={2}
        sx={{ borderRadius: "default", cursor: "pointer" }}
        onClick={() => props.navigator.navigate("account")}
      >
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
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
        <Flex flexDirection="column" justifyContent="center">
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
              sx={{ position: "relative" }}
              justifyContent="center"
              alignItems="center"
              onClick={() => {
                changeAccent(color.code);
              }}
            >
              {color.code === theme.colors.primary && (
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
          onClick={() => {
            setCheck(!check);
            changeTheme();
          }}
        >
          <Text fontSize="body">Dark Mode</Text>
          {check ? <Icon.Check /> : <Icon.CircleEmpty />}
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
};

const SettingsContainer = props => {
  useEffect(() => {
    const SettingsNavigator = require("../navigation/navigators/settingnavigator")
      .default;
    if (!SettingsNavigator.restore()) {
      SettingsNavigator.navigate("settings");
    }
  }, []);
  return (
    <Flex
      className="SettingsNavigator"
      flexDirection="column"
      flex="1 1 auto"
    />
  );
};

const Titles = {
  general: "General",
  account: "Account",
  accent: "Accent Color",
  TOS: "Terms of Service",
  privacy: "Privacy Policy",
  about: "About"
};

export { Settings, SettingsContainer };
