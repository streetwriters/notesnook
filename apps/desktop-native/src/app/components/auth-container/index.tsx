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

import type { ReactNode } from "react";
import { strings } from "@notesnook/intl";
import { Box, Button, Flex, Icon, Image, Text } from "@ui";
import { rasterAssets } from "../../assets/raster.generated";
import { SettingsDialog } from "../../dialogs/settings";
import { authWaves } from "./auth-art.generated";

function AuthContainer(props: { children?: ReactNode }) {
  return (
    <Flex
      testID="auth-container"
      sx={{
        flexDirection: "row",
        position: "relative",
        flex: 1,
        bg: "background",
        width: "100%"
      }}
    >
      <Box
        sx={{
          padding: "spacing8",
          height: [0, 0, "100%"],
          width: [0, 0, "48%"],
          overflow: "hidden"
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
              gap: 76,
              position: "relative",
              zIndex: 1,
              height: "100%"
            }}
          >
            <Flex
              sx={{
                gap: "spacing6",
                flexDirection: "column",
                mx: "spacing11",
                mt: 60
              }}
            >
              <Flex sx={{ flexDirection: "column" }}>
                <Text
                  sx={{ color: "heading", fontWeight: 700, fontSize: "2xl" }}
                >
                  End-to-end encrypted.
                </Text>
                <Text
                  sx={{ color: "heading", fontWeight: 700, fontSize: "2xl" }}
                >
                  {strings.privacySimplified()}
                </Text>
              </Flex>
              <Text
                sx={{ color: "paragraph", fontWeight: 400, fontSize: "md" }}
              >
                {strings.privacySimplifiedDesc()}
              </Text>
            </Flex>
            <Image
              src={rasterAssets["auth/notesnook-phone.png"]}
              resizeMode="contain"
              sx={{ alignSelf: "center", width: "85%", aspectRatio: 1 }}
            />
          </Flex>
          <Box
            sx={{
              position: "absolute",
              bottom: 50,
              right: -100
            }}
          >
            <Icon svg={authWaves} size={1100} rotate={-34.33} />
          </Box>
          <Flex
            sx={{
              position: "absolute",
              bottom: 20,
              right: 30,
              zIndex: 1
            }}
          >
            <Button
              variant="new_anchor"
              onPress={() => SettingsDialog.show({ activeSection: "servers" })}
            >
              <Text sx={{ color: "accent" }}>{strings.changeServer()}</Text>
            </Button>
          </Flex>
        </Box>
      </Box>
      {props.children}
    </Flex>
  );
}
export default AuthContainer;
