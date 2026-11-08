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

import { Flex, Text, type SxProp } from "@ui";

function stripInline(line: string) {
  return line
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1");
}

export function MarkdownText(props: { text: string; sx?: SxProp }) {
  const lines = props.text.split("\n");
  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing2", ...props.sx }}>
      {lines.map((line, index) => {
        const heading = /^#{1,6}\s+(.*)$/.exec(line);
        const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
        if (!line.trim()) return <Flex key={index} sx={{ height: 4 }} />;
        return (
          <Text
            key={index}
            variant="body"
            selectable
            sx={{
              fontWeight: heading ? "bold" : "normal",
              color: heading ? "heading" : "paragraph",
              pl: bullet ? "spacing4" : 0
            }}
          >
            {bullet
              ? `• ${stripInline(bullet[1])}`
              : stripInline(heading ? heading[1] : line)}
          </Text>
        );
      })}
    </Flex>
  );
}

export function stripMarkdown(text: string) {
  return text.split("\n").map(stripInline).join("\n");
}
