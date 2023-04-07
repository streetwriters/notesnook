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

import ReactDOM from "react-dom";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import Config from "../../utils/config";
import { getDownloadLink, getPlatform } from "../../utils/platform";
import DropdownButton from "../dropdown-button";
import ThemeProvider from "../theme-provider";

const nativeFeatures = [
  "Native high-performance encryption",
  "Automatic backups",
  "Pin notes in notifications drawer",
  "Share & append to notes from anywhere",
  "Quick note widgets",
  "App lock"
];

const platform = getPlatform();
const isMobile = platform === "Android" || platform === "iOS";
function getOptions(onClose) {
  return getDownloadLink(platform).map((item) => ({
    key: item.type || item.link,
    title: () => {
      return `${item.type}`;
    },
    onClick: () => {
      window.open(item.link, "_blank");
      onClose();
      Config.set("installNotice", false);
    }
  }));
}

export default function InstallNotice({ onClose }) {
  return (
    <Flex
      sx={{
        position: "absolute",
        top: ["initial", 2],
        right: [0, 2],
        left: [2, "initial"],
        bottom: [2, "initial"],
        zIndex: 2,
        bg: "background",
        borderRadius: "default",
        border: "1px solid var(--border)",
        width: ["95%", 400],
        flexDirection: "column"
      }}
      p={2}
    >
      <Text variant={"title"}>Install Notesnook</Text>
      <Text variant={"body"}>
        For a more integrated user experience, try out Notesnook for {platform}.
      </Text>
      {isMobile && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 1,
            rowGap: 1,
            mt: 1
          }}
        >
          {nativeFeatures.map((feature) => (
            <Flex
              key={feature}
              p={1}
              sx={{
                borderRadius: "default",
                border: "1px solid var(--border)"
              }}
            >
              <Text variant="body" ml={1}>
                {feature}
              </Text>
            </Flex>
          ))}
        </Box>
      )}

      <Flex mt={[4, 1]} sx={{ alignItems: "center" }}>
        <DropdownButton title={"Options"} options={getOptions(onClose)} />
        <Button
          variant={"secondary"}
          ml={1}
          onClick={() => {
            onClose();
            Config.set("installNotice", false);
          }}
          sx={{ alignSelf: "start" }}
        >
          {`Don't show again`}
        </Button>
      </Flex>
    </Flex>
  );
}

export function showInstallNotice() {
  if (!Config.get("installNotice", true)) return;

  const root = document.getElementById("floatingViewContainer");

  if (root) {
    return new Promise((resolve) => {
      const perform = (result) => {
        ReactDOM.unmountComponentAtNode(root);
        resolve(result);
      };
      ReactDOM.render(
        <ThemeProvider>
          <InstallNotice onClose={perform} />
        </ThemeProvider>,
        root
      );
    });
  }
  return Promise.reject("No element with id 'floatingViewContainer'");
}
