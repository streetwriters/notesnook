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
import { Button, Flex, Text } from "@ui";
import { Plus, type Icon } from "../icons";

export type RouteContainerButton = {
  title: string;
  onClick: () => void;
  icon?: Icon;
};

type RouteContainerProps = {
  title?: string | (() => Promise<string | undefined>);
  routeKey: string;
  buttons?: RouteContainerButton;
  children?: ReactNode;
};

export default function RouteContainer(props: RouteContainerProps) {
  const { buttons } = props;
  const title = typeof props.title === "string" ? props.title : undefined;
  const ButtonIcon = buttons?.icon ?? Plus;
  return (
    <Flex sx={{ flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Flex
        testID="route-header"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: "spacing6",
          py: "spacing4",
          borderBottom: "1px solid",
          borderBottomColor: "separator"
        }}
      >
        <Text
          testID="route-title"
          sx={{ fontSize: "title", fontWeight: "heading", color: "heading" }}
        >
          {title}
        </Text>
        {buttons ? (
          <Button
            testID="route-action"
            variant="secondary"
            onPress={buttons.onClick}
            sx={{ p: "spacing3" }}
          >
            <ButtonIcon size="small" color="icon" />
          </Button>
        ) : null}
      </Flex>
      {props.children}
    </Flex>
  );
}
