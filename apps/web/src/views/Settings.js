import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Text, Image } from "rebass";
import * as Icon from "react-feather";
import { Switch } from "@rebass/forms";
import "../app.css";
import { changeTheme, isDarkTheme, changeAccent } from "../utils/theme";
import { useTheme } from "emotion-theming";

const Settings = props => {
  const [check, setCheck] = useState(isDarkTheme());
  const theme = useTheme();
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
        <Flex
          flexDirection="row"
          bg="shade"
          mx={2}
          p={2}
          sx={{ borderRadius: "default" }}
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
              borderRadius: 80,
              color: "secondary"
            }}
          >
            <Icon.User style={{ margin: 2 }} size={20} />
          </Flex>
          <Flex flexDirection="column" justifyContent="center">
            <Flex fontSize="subBody" color="gray">
              You are not logged in
            </Flex>
            <Flex fontSize="body" color="primary">
              Login to sync notes.
            </Flex>
          </Flex>
        </Flex>
        <Box
          px={2}
          mt={2}
          fontSize="body"
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
            fontSize="body"
            alignItems="center"
            px={2}
            sx={{ fontSize: "body" }}
          >
            {Titles.accent}
          </Flex>

          <Flex flexDirection="column" justifyContent="center" mx={2}>
            <Flex
              flexWrap="wrap"
              sx={{ marginBottom: 2, borderRadius: "default" }}
              justifyContent="left"
              my={2}
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
                    <Icon.Check
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        color: "white"
                      }}
                      size={20}
                    />
                  )}
                  <Icon.Circle
                    size={40}
                    style={{ cursor: "pointer" }}
                    fill={color.code}
                    strokeWidth={0}
                  />
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Flex flexDirection="row" px={2} justifyContent="space-between">
            <Text fontSize="body">Dark Mode</Text>
            <Switch
              onClick={() => {
                setCheck(!check);
                changeTheme();
              }}
              checked={check}
            />
          </Flex>
        </Box>
        <Box
          px={2}
          mt={2}
          fontSize="body"
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
