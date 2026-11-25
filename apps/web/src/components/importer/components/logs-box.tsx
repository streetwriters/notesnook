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

import { Box, Flex, Text } from "@theme-ui/components";
import { ScrollContainer } from "@notesnook/ui";
import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";

export type LogMessage = {
  type: "info" | "error";
  text: string;
  date: number;
};

export function LogsBox(props: { logs: LogMessage[]; failed?: boolean }) {
  const { logs, failed } = props;
  if (logs.length === 0) return null;
  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: failed ? "spacing2" : "spacing3",
        p: "spacing4",
        bg: "background-secondary",
        borderRadius: "radius1",
        overflow: "hidden"
      }}
    >
      <Text
        sx={{
          fontSize: "sm",
          fontWeight: 500,
          lineHeight: 1,
          color: "heading"
        }}
      >
        {strings.logs()}
      </Text>
      <ScrollContainer>
        <Flex
          sx={{
            fontFamily: "body",
            flexDirection: "column",
            gap: "spacing2",
            maxHeight: 250,
            fontSize: failed ? "xxs" : "xs",
            lineHeight: 1,
            color: failed ? "paragraph-secondary" : "paragraph",
            whiteSpace: "pre-wrap"
          }}
        >
          {logs.map((log, index) => (
            <Box
              key={index.toString()}
              sx={{
                color: log.type === "error" ? "paragraph-error" : "inherit"
              }}
            >
              [{getFormattedDate(log.date, "date-time")}] {log.text}
            </Box>
          ))}
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}
