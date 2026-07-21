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

import { useMemo } from "react";
import { Box, Button, Flex, Image, Link, Text } from "@theme-ui/components";
import { getRandom, usePromise } from "@notesnook/common";
import Holenstein from "../../assets/testimonials/holenstein.jpg";
import Jason from "../../assets/testimonials/jason.jpg";
import Cameron from "../../assets/testimonials/cameron.jpg";
import { hosts } from "@notesnook/core";
import { SettingsDialog } from "../../dialogs/settings";
import { strings } from "@notesnook/intl";
import NotesnookPhoneImage from "../../assets/auth/notesnook-phone.png";
import CapaGreen from "../../assets/auth/capa-green.svg";

function AuthContainer(props) {
  // const version = usePromise(
  //   async () =>
  //     await fetch(`${hosts.API_HOST}/version`)
  //       .then((r) => r.json())
  //       .catch(() => undefined)
  // );

  return (
    <Flex
      sx={{
        position: "relative",
        height: "100%",
        bg: "background",
        width: "100%"
      }}
    >
      <Box
        sx={{
          width: "fit-content",
          padding: "spacing8",
          height: [0, 0, "100%"],
          width: [0, 0, "48vw"]
        }}
      >
        <Box
          sx={{
            bg: "shade",
            height: "100%",
            borderRadius: "radius4",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Flex
            sx={{
              flexDirection: "column",
              gap: "76px",
              position: "relative",
              zIndex: 1,
              height: "100%"
            }}
          >
            <Flex
              sx={{
                gap: "spacing6",
                flexDirection: "column",
                marginX: "spacing11",
                marginTop: "60px"
              }}
            >
              <Flex sx={{ flexDirection: "column" }}>
                <Text
                  sx={{
                    color: "heading",
                    fontWeight: 700,
                    fontSize: "2xl"
                  }}
                >
                  End-to-end encrypted.
                </Text>
                <Text
                  sx={{
                    color: "heading",
                    fontWeight: 700,
                    fontSize: "2xl"
                  }}
                >
                  Privacy Simplified.
                </Text>
              </Flex>
              <Text
                sx={{
                  color: "paragraph",
                  fontWeight: 400,
                  fontSize: "md"
                }}
              >
                Write notes with absolute freedom. No spying, no tracking, no
                backdoor access. Just you and your thoughts.
              </Text>
            </Flex>
            <Image
              src={NotesnookPhoneImage}
              sx={{
                marginLeft: "58px",
                objectFit: "contain",
                height: "100%",
                flex: 0.95,
                overflow: "hidden"
              }}
            />
          </Flex>
          <Box
            sx={{
              position: "absolute",
              bottom: 50,
              left: -100,
              width: "998px",
              height: "245px",
              transform: "rotate(-34.33deg)",
              transformOrigin: "center center"
            }}
          >
            <Image
              src={CapaGreen}
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                pointerEvents: "none"
              }}
            />
          </Box>
          <Flex
            sx={{
              position: "absolute",
              bottom: "20px",
              right: "30px",
              zIndex: 1
            }}
          >
            <Button
              variant="anchor"
              onClick={() => SettingsDialog.show({ activeSection: "servers" })}
              sx={{
                fontSize: "sm",
                fontWeight: 500,
                color: "accent",
                textDecoration: "underline"
              }}
            >
              {strings.configure()}
            </Button>
          </Flex>
        </Box>
      </Box>
      {props.children}
    </Flex>
  );
}
export default AuthContainer;
