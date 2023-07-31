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
import { appVersion } from "../utils/version";

export function Footer() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: 100,
        pt: 50,
        pb: 50,
        borderTop: "1px solid var(--border)",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Text variant="body">Notesnook Vericrypt (v{appVersion})</Text>
      <Text variant="subBody">
        © {new Date().getFullYear()} Streetwriters LLC
      </Text>
    </Flex>
  );
}
