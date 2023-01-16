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

import Logo from "../../assets/logo.svg";
import LogoDark from "../../assets/logo-dark.svg";
import { Button, Flex, Image, Text } from "@theme-ui/components";
import { hashNavigate } from "../../navigation";
import * as Icon from "../icons";
import { useStore as useThemeStore } from "../../stores/theme-store";

function EditorPlaceholder() {
  const theme = useThemeStore((store) => store.theme);
  return (
    <Flex
      sx={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Image src={theme === "dark" ? LogoDark : Logo} sx={{ width: 150 }} />
      <Text variant="body" mt={2} sx={{ textAlign: "center" }}>
        Please create or open a note to start editing.
      </Text>
      <Button
        mt={2}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex"
        }}
        variant="tool"
        onClick={() =>
          hashNavigate("/notes/create", { addNonce: true, replace: true })
        }
      >
        <Icon.Plus size={18} color="primary" />
        <Text ml={1}>Make a new note</Text>
      </Button>
    </Flex>
  );
}
export default EditorPlaceholder;
