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
import { Flex, Text } from "@theme-ui/components";
import { useState } from "react";
import { IconType } from "react-icons";
import { MdClose } from "react-icons/md";
import { ThemeProvider } from "@emotion/react";
import { getDefaultAccentColor, useTheme } from "@notesnook/theme";

type StepSeperatorProps = {
  icon?: IconType;
  onShowPopup?: () => Promise<boolean>;
  tooltip?: string;
  popup?: { title: string; body?: JSX.Element };
};

export function StepSeperator(props: StepSeperatorProps) {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const theme = useTheme(
    { accent: getDefaultAccentColor(), theme: "dark" },
    false
  );
  return (
    <Flex
      sx={{
        height: 200,
        width: 2,
        bg: "bgSecondary",
        justifyContent: "center",
        alignItems: "center",
        position: "relative"
      }}
    >
      <Flex
        sx={{
          position: "absolute",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
        tabIndex={1}
      >
        {props.icon && (
          <Flex
            sx={{
              bg: "background",
              p: 2,
              boxShadow: "0px 0px 10px 0px #00000011",
              borderRadius: 50,
              transition: "transform 100ms ease-out",
              cursor: "pointer",
              ":hover": {
                transform: "scale(1.1)"
              }
            }}
            title={props.tooltip}
            onClick={async () => {
              if (showPopup) return setShowPopup(false);
              if (!showPopup && props.onShowPopup)
                setShowPopup(await props.onShowPopup());
            }}
          >
            <props.icon size={20} />
          </Flex>
        )}
        {showPopup && props.popup && (
          <Flex
            sx={{
              position: "absolute",
              top: 60,
              p: 2,
              width: 400
            }}
          >
            <ThemeProvider theme={theme}>
              <Flex
                sx={{
                  bg: "background",
                  borderRadius: "default",
                  boxShadow: "0px 0px 10px 0px #00000011",
                  p: 2,
                  flexDirection: "column",
                  color: "icon"
                }}
              >
                <Flex
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Text variant="title">{props.popup.title}</Text>
                  <MdClose
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPopup(false)}
                  />
                </Flex>
                {props.popup.body}
              </Flex>
            </ThemeProvider>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
