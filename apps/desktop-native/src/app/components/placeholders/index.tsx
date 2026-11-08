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
import { Flex, Icon, Text } from "@ui";
import { illustrations } from "./illustrations.generated";

type Variant =
  | "home"
  | "favorite"
  | "archive"
  | "monographs"
  | "tag"
  | "search"
  | "trash"
  | "reminders";

function content(variant: Variant) {
  const accent = (text: string) => <Text sx={{ color: "accent" }}>{text}</Text>;
  const home = {
    image: "home",
    title: strings.createYourFirstNote(),
    description: (
      <>
        {strings.createFirstNoteHint[0]()} {accent(strings.newNote())}{" "}
        {strings.createFirstNoteHint[1]()}
      </>
    )
  };
  switch (variant) {
    case "favorite":
      return {
        image: "favorite",
        title: strings.noFavoritesYet(),
        description: strings.noFavoritesYetDesc()
      };
    case "trash":
      return {
        image: "trash",
        title: strings.trashIsEmpty(),
        description: strings.trashIsEmptyDesc()
      };
    case "archive":
      return {
        image: "archive",
        title: strings.noArchivesYet(),
        description: strings.noArchivesYetDesc()
      };
    case "monographs":
      return {
        image: "monograph",
        title: strings.whatAreMonographs(),
        description: (
          <>
            {strings.monographsEmptyDesc()} {accent(strings.learnMore())}
          </>
        )
      };
    case "reminders":
      return {
        image: "reminder",
        title: strings.noRemindersToday(),
        description: strings.noRemindersTodayDesc()
      };
    case "tag":
      return {
        image: "tag",
        title: strings.noNotesInTag(),
        description: strings.noNotesInTagDesc()
      };
    default:
      return home;
  }
}

export function ListPanePlaceholder({ variant }: { variant: Variant }) {
  const { image, title, description } = content(variant);
  return (
    <Flex
      testID="list-placeholder"
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing7",
        width: "100%"
      }}
    >
      <Icon svg={illustrations[image]} size={230} />
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: "spacing3"
        }}
      >
        <Text
          variant="body"
          sx={{
            fontSize: "md",
            fontWeight: 600,
            color: "heading",
            lineHeight: 1,
            textAlign: "center"
          }}
        >
          {title}
        </Text>
        <Text
          sx={{
            maxWidth: 250,
            fontSize: "sm",
            color: "paragraph",
            lineHeight: 1.2,
            textAlign: "center"
          }}
        >
          {description}
        </Text>
      </Flex>
    </Flex>
  );
}
