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
import { Plus } from "../icons";
import { strings } from "@notesnook/intl";
import { CREATE_BUTTON_MAP } from "../../common";
import listPaneEmptyHomeView from "../../assets/list-pane-empty-home-view.svg";
import listPaneEmptyFavoriteView from "../../assets/list-pane-empty-favorite-view.svg";
import listPaneEmptyTrashView from "../../assets/list-pane-empty-trash-view.svg";
import listPaneEmptyArchiveView from "../../assets/list-pane-empty-archive-view.svg";
import listPaneEmptyMonographView from "../../assets/list-pane-empty-monograph-view.svg";
import listPaneEmptyReminderView from "../../assets/list-pane-empty-reminder-view.svg";
import listPaneEmptyTagView from "../../assets/list-pane-empty-tag-view.svg";

const SIDEBAR_PLACEHOLDER_VARIANTS = {
  notebooks: {
    title: "No notebooks yet",
    text: "Start organizing your ideas, notes, and thoughts. ",
    button: {
      ...CREATE_BUTTON_MAP.notebooks,
      icon: Plus,
      title: strings.createNotebook()
    }
  },
  tags: {
    title: "No tags yet",
    text: "Create your first tag to start organizing your workspace.",
    button: {
      ...CREATE_BUTTON_MAP.tags,
      icon: Plus,
      title: "Add tag"
    }
  }
};

export function SidebarPlaceholder({
  variant
}: {
  variant: keyof typeof SIDEBAR_PLACEHOLDER_VARIANTS;
}) {
  const { title, text, button } = SIDEBAR_PLACEHOLDER_VARIANTS[variant];

  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: "spacing6",
        px: "spacing4",
        width: "100%",
        alignItems: "center"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: "spacing3",
          width: "100%",
          textAlign: "center"
        }}
      >
        <Text
          variant="body"
          sx={{
            fontSize: "md",
            fontWeight: "heading",
            color: "heading",
            lineHeight: 1
          }}
        >
          {title}
        </Text>
        <Text
          variant="body"
          sx={{
            width: "208px",
            fontSize: "sm",
            color: "paragraph",
            lineHeight: 1.2
          }}
        >
          {text}
        </Text>
      </Flex>
      <Button
        onClick={button.onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "spacing3",
          color: "accent",
          fontSize: "sm",
          fontWeight: 600,
          lineHeight: 1,
          width: "fit-content"
        }}
      >
        {<button.icon size={15} color="accent" />}
        {button.title}
      </Button>
    </Flex>
  );
}

const LIST_PANE_PLACEHOLDER_VARIANTS = {
  home: {
    image: listPaneEmptyHomeView,
    title: "Create your first note.",
    description: (
      <>
        Click the{" "}
        <Text as="span" sx={{ color: "accent" }}>
          New Note
        </Text>{" "}
        button in the sidebar to get started.
      </>
    )
  },
  favorite: {
    image: listPaneEmptyFavoriteView,
    title: "No favorites yet",
    description: "Mark important notes by adding them to favorites."
  },
  trash: {
    image: listPaneEmptyTrashView,
    title: "Trash is empty",
    description: "All the deleted items will be shown here."
  },
  archive: {
    image: listPaneEmptyArchiveView,
    title: "No archives currently",
    description: "Keep your workspace clean by archiving old notes."
  },
  monographs: {
    image: listPaneEmptyMonographView,
    title: "What are monographs?",
    description: (
      <>
        Turn your notes into published, publication-ready documents.{" "}
        <Text
          as="span"
          sx={{ color: "accent", cursor: "pointer" }}
          onClick={() =>
            window.open(
              "https://notesnook.com/help/publish-notes-with-monographs",
              "_blank"
            )
          }
        >
          Learn more
        </Text>
      </>
    )
  },
  reminders: {
    image: listPaneEmptyReminderView,
    title: "No reminders today",
    description: "Tap the + button on top to add one."
  },
  tag: {
    image: listPaneEmptyTagView,
    title: "No notes in this tag",
    description: "Notes added to this tag will appear here."
  },
  /**
   * TODO: implement a proper placeholder for the search view.
   */
  search: {
    image: listPaneEmptyHomeView,
    title: "Create your first note.",
    description: (
      <>
        Click the{" "}
        <Text as="span" sx={{ color: "accent" }}>
          New Note
        </Text>{" "}
        button in the sidebar to get started.
      </>
    )
  }
} as const;

export function ListPanePlaceholder({
  variant
}: {
  variant: keyof typeof LIST_PANE_PLACEHOLDER_VARIANTS;
}) {
  const { image, title, description } = LIST_PANE_PLACEHOLDER_VARIANTS[variant];

  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing7",
        width: "100%"
      }}
    >
      <img src={image} alt="" />
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: "spacing3",
          textAlign: "center"
        }}
      >
        <Text
          variant="body"
          sx={{
            fontSize: "md",
            fontWeight: 600,
            color: "heading",
            lineHeight: 1
          }}
        >
          {title}
        </Text>
        <Text
          sx={{
            fontSize: "sm",
            color: "paragraph",
            lineHeight: 1.2
          }}
        >
          {description}
        </Text>
      </Flex>
    </Flex>
  );
}
