import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Text } from "rebass";
import * as Icon from "react-feather";
import { Switch, Select } from "@rebass/forms";
import "../app.css";
import { changeTheme, isDarkTheme, changeAccent } from "../utils/theme";

const Settings = props => {
  const [check, setCheck] = useState(isDarkTheme());
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
        <Button
          variant="setting"
          onClick={() => {
            props.navigator.navigate("general", {
              title: Titles.general
            });
          }}
        >
          {Titles.general}
        </Button>
        <Button
          variant="setting"
          onClick={() => {
            props.navigator.navigate("account", {
              title: Titles.account
            });
          }}
        >
          {Titles.account}
        </Button>
        <Box
          sx={{
            borderLeft: "0px Solid",
            borderRight: "0px Solid",
            borderTop: "0px Solid",
            borderBottom: "1px Solid",
            borderColor: "border",
            "&:hover": { borderColor: "primary" }
          }}
          py="15px"
        >
          <Flex fontSize="body" alignItems="center">
            <Text px="16px" sx={{ fontFamily: "body", fontSize: "title" }}>
              {Titles.theme}
            </Text>
          </Flex>

          <Flex flexDirection="column" justifyContent="center" mx="7%">
            <Flex
              flexWrap="wrap"
              sx={{ marginBottom: 2 }}
              justifyContent="left"
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
                <Box
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    changeAccent(color.code);
                  }}
                >
                  <Icon.Circle size={50} fill={color.code} strokeWidth={0} />
                </Box>
              ))}
            </Flex>
            <Flex flexDirection="row" justifyContent="center">
              <Text width={1 / 2}>Dark Mode</Text>{" "}
              <Flex width={1 / 2} justifyContent="right">
                <Switch
                  onClick={() => {
                    setCheck(!check);
                    changeTheme();
                  }}
                  checked={check}
                />
              </Flex>
            </Flex>
            {/* <Flex flexDirection="row" justifyContent="center" pt="15px">
              <Text width={1 / 2}>Font Size</Text>{" "}
              <Flex width={1 / 2} justifyContent="right">
                <Select
                  id="country"
                  name="country"
                  defaultValue="46"
                  fontSize="14px"
                  py="0px"
                  pr="32px"
                  DownArrow="false"
                >
                  {[
                    { label: "red", code: "12" },
                    { label: "orange", code: "05" },
                    { label: "yellow", code: "16" },
                    { label: "green", code: "36" },
                    { label: "blue", code: "46" },
                    { label: "purple", code: "64" },
                    { label: "gray", code: "75" },
                    { label: "lightblue", code: "88" },
                    { label: "indigo", code: "99" },
                    { label: "lightpink", code: "12" }
                  ].map(color => (
                    <option key={color.label}>{color.code}</option>
                  ))}
                </Select>
              </Flex>
            </Flex> */}
          </Flex>
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
    //HOTFIX
    SettingsNavigator.history = [];
    SettingsNavigator.lastRoute = undefined;
    SettingsNavigator.navigate("settings");
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
  theme: "Theme",
  TOS: "Terms of Service",
  privacy: "Privacy Policy",
  about: "About"
};

export { Settings, SettingsContainer };
