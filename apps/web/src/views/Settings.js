import React, { useState } from "react";
import { Box, Button, Flex, Text } from "rebass";
import * as Icon from "react-feather";
import { Switch } from "@rebass/forms";
import "../app.css";
import { changeTheme, isDarkTheme, changeAccent } from "../utils/theme";
import Account from "./Account";

function Settings() {
  const [check, setCheck] = useState(isDarkTheme());
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
        {/* <Account /> */}
        <Button variant="setting">General</Button>
        <Button variant="setting" onClick={() => {}}>
          Account
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
              Theme
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
          </Flex>
        </Box>
        <Button variant="setting">Terms of Service</Button>
        <Button variant="setting">Privacy Policy</Button>
        <Button variant="setting">About</Button>
      </Flex>
    </Flex>
  );
}

export default Settings;
