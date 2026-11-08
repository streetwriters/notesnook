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

import { strings } from "@notesnook/intl";
import { Flex, Text, TITLE_BAR_HEIGHT } from "@ui";
import { navigate, usePathname } from "../../navigation";
import {
  Archive,
  Bell,
  Book,
  Note,
  Settings,
  Star,
  Trash,
  type Icon
} from "../icons";

export type NavigationTabItem = {
  id: "home" | "notebooks" | "tags";
  title: string;
};

type NavigationEntry = {
  id: string;
  title: string;
  path: string;
  icon: Icon;
};

function entries(): NavigationEntry[] {
  return [
    { id: "notes", title: strings.routes.Notes(), path: "/notes", icon: Note },
    {
      id: "favorites",
      title: strings.routes.Favorites(),
      path: "/favorites",
      icon: Star
    },
    {
      id: "reminders",
      title: strings.routes.Reminders(),
      path: "/reminders",
      icon: Bell
    },
    {
      id: "monographs",
      title: strings.routes.Monographs(),
      path: "/monographs",
      icon: Book
    },
    {
      id: "archive",
      title: strings.archive(),
      path: "/archive",
      icon: Archive
    },
    { id: "trash", title: strings.routes.Trash(), path: "/trash", icon: Trash }
  ];
}

export function NavigationMenu() {
  const pathname = usePathname();
  return (
    <Flex
      testID="navigation-menu"
      sx={{
        flexDirection: "column",
        flex: 1,
        bg: "background",
        borderRight: "1px solid",
        borderRightColor: "separator",
        pt: TITLE_BAR_HEIGHT,
        pb: "spacing4"
      }}
    >
      <Flex sx={{ flexDirection: "column", flex: 1, gap: "spacing1" }}>
        {entries().map((entry) => (
          <NavigationItem
            key={entry.id}
            entry={entry}
            selected={pathname === entry.path}
          />
        ))}
      </Flex>
      <NavigationRow
        testID="nav-settings"
        title={strings.routes.Settings()}
        icon={Settings}
        selected={false}
      />
    </Flex>
  );
}

function NavigationItem(props: { entry: NavigationEntry; selected: boolean }) {
  const { entry, selected } = props;
  return (
    <NavigationRow
      testID={`nav-${entry.id}`}
      title={entry.title}
      icon={entry.icon}
      selected={selected}
      onPress={() => navigate(entry.path, { notify: true })}
    />
  );
}

function NavigationRow(props: {
  testID: string;
  title: string;
  icon: Icon;
  selected: boolean;
  onPress?: () => void;
}) {
  const RowIcon = props.icon;
  return (
    <Flex
      testID={props.testID}
      onPress={props.onPress}
      sx={{
        alignItems: "center",
        gap: "spacing4",
        mx: "spacing3",
        px: "spacing5",
        py: "spacing4",
        borderRadius: "default",
        bg: props.selected ? "background-selected" : "transparent",
        ":hover": { bg: props.selected ? "hover-selected" : "hover" }
      }}
    >
      <RowIcon
        size="medium"
        color={props.selected ? "icon-selected" : "icon"}
      />
      <Text
        testID={`${props.testID}-title`}
        sx={{
          fontSize: "sm",
          fontWeight: props.selected ? "bold" : "body",
          color: props.selected ? "paragraph-selected" : "paragraph"
        }}
      >
        {props.title}
      </Text>
    </Flex>
  );
}
