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

import { Flex, FlexProps, Text } from "@theme-ui/components";
import { ScrollContainer } from "@notesnook/ui";
import { PropsWithChildren, ReactNode } from "react";
import { CardTitle, SettingsCard } from "../../settings-ui";
import { strings } from "@notesnook/intl";

export function ImporterCard(props: PropsWithChildren<FlexProps>) {
  const { sx, ...rest } = props;
  return (
    <SettingsCard
      {...rest}
      sx={{ alignItems: "stretch", bg: "background", ...sx }}
    />
  );
}

export { CardTitle };

export function LogsBox(props: { children: ReactNode; failed?: boolean }) {
  const { failed } = props;
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
          {props.children}
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}
