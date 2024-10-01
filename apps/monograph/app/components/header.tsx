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

import { Button, Flex, Text } from "@theme-ui/components";

export function Header() {
  return (
    <Flex
      sx={{
        bg: "background-secondary",
        borderBottom: "1px solid var(--border)",
        p: 2,
        px: [2, "15%"],
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <Text
        sx={{
          fontFamily: "monospace",
          fontSize: 22
        }}
      >
        <span style={{ color: "var(--accent)" }}>Mono</span>graph
      </Text>
      <Button variant="accent">Publish a note</Button>
    </Flex>
  );
}
