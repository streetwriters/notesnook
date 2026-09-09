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
import { TipContext, useTip } from "../../hooks/use-tip";
import { Info, Sync } from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import { strings } from "@notesnook/intl";
import listPaneEmptyHomeView from "../../assets/list-pane-empty-home-view.svg";
import listPaneEmptyFavoriteView from "../../assets/list-pane-empty-favorite-view.svg";
import listPaneEmptyTrashView from "../../assets/list-pane-empty-trash-view.svg";
import listPaneEmptyArchiveView from "../../assets/list-pane-empty-archive-view.svg";
import listPaneEmptyMonographView from "../../assets/list-pane-empty-monograph-view.svg";
import listPaneEmptyReminderView from "../../assets/list-pane-empty-reminder-view.svg";

type PlaceholderProps = { context: TipContext; text?: string };
function Placeholder(props: PlaceholderProps) {
  const { context, text } = props;
  const tip = useTip(context);
  const syncStatus = useAppStore((store) => store.syncStatus);
  const isFirstSync = useAppStore((store) => store.lastSynced === 0);

  if (isFirstSync && syncStatus.key === "syncing" && context === "notes") {
    return (
      <Flex
        variant="columnCenter"
        sx={{
          position: "relative",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          alignSelf: "stretch",
          px: 6
        }}
      >
        <Flex
          sx={{
            border: "1px solid var(--accent)",
            alignItems: "center",
            borderRadius: 50,
            p: 1,
            py: "1.5px"
          }}
        >
          <Sync color="accent" size={12} sx={{ mr: "small" }} />
          <Text variant="subBody" sx={{ fontSize: 10 }} color="accent">
            {strings.syncingYourNotes()}
          </Text>
        </Flex>

        <Text variant="subBody" sx={{ fontSize: "body", mt: 1 }}>
          {strings.networkProgress(syncStatus.type || "sync")}{" "}
          {syncStatus.progress} {strings.items()}
        </Text>
      </Flex>
    );
  }
  if (!tip) return null;

  return (
    <>
      <Flex
        variant="columnCenter"
        sx={{
          position: "relative",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          alignSelf: "stretch",
          px: 6
        }}
      >
        <Flex
          sx={{
            border: "1px solid var(--accent)",
            borderRadius: 50,
            p: 1,
            py: "1.5px"
          }}
        >
          <Info color="accent" size={13} sx={{ mr: "small" }} />
          <Text variant="subBody" sx={{ fontSize: 10 }} color="accent">
            {strings.tip()}
          </Text>
        </Flex>
        <Text variant="subBody" sx={{ fontSize: "body", mt: 1 }}>
          {text || tip.text}
        </Text>
        {tip.button && (
          <Button
            sx={{
              mt: 2,
              alignItems: "center",
              justifyContent: "center",
              display: "flex"
            }}
            variant="secondary"
            onClick={tip.button.onClick}
          >
            <Text mr={1} color="accent">
              {tip.button.title}
            </Text>
            {tip.button.icon && <tip.button.icon size={18} color="accent" />}
          </Button>
        )}
      </Flex>
    </>
  );
}
export default Placeholder;

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
