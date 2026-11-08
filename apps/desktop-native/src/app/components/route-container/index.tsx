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

import { useRef, type ReactNode } from "react";
import { strings } from "@notesnook/intl";
import type { GroupingKey } from "@notesnook/core";
import { Box, Button, Flex, Input, Text } from "@ui";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { useStore as useSearchStore } from "../../stores/search-store";
import { useStore as useTrashStore } from "../../stores/trash-store";
import { List, SearchIcon, Sliders, ViewList, type Icon } from "../icons";
import type { Context } from "../list-container/types";

export type RouteContainerButton = {
  title: string;
  onClick: () => void;
  icon?: Icon;
};

type RouteContainerProps = {
  title?: string | (() => Promise<string | undefined>);
  type?: string;
  routeKey: string;
  buttons?: RouteContainerButton;
  children?: ReactNode;
};

export default function RouteContainer(props: RouteContainerProps) {
  return (
    <>
      <Header {...props} />
      {props.children}
    </>
  );
}

function useHasItems(type?: string, routeKey?: string) {
  const hasNoteItems = useNoteStore((store) =>
    Boolean((routeKey === "home" ? store.notes : store.contextNotes)?.length)
  );
  const hasReminderItems = useReminderStore((store) =>
    Boolean(store.reminders?.length)
  );
  const hasTrashItems = useTrashStore((store) => Boolean(store.trash?.length));
  return type === "reminders"
    ? hasReminderItems
    : type === "trash"
    ? hasTrashItems
    : hasNoteItems;
}

function useGroupingState(
  type: string | undefined,
  routeKey: string,
  noteContext: Context | undefined
) {
  const groupingKey: GroupingKey =
    type === "reminders"
      ? "reminders"
      : type === "trash"
      ? "trash"
      : routeKey === "home"
      ? "home"
      : noteContext?.type === "favorite"
      ? "favorites"
      : noteContext?.type === "archive"
      ? "archive"
      : "notes";
  const canToggleView =
    groupingKey === "home" ||
    groupingKey === "notes" ||
    groupingKey === "favorites" ||
    groupingKey === "archive";
  return { groupingKey, canToggleView };
}

function HeaderActions(props: {
  groupingKey: GroupingKey;
  canToggleView: boolean;
  viewMode: "compact" | "detailed" | undefined;
  setViewMode: (viewMode: "compact" | "detailed") => void;
  routeButton?: RouteContainerButton;
  hasItems: boolean;
}) {
  const { groupingKey, viewMode, routeButton, hasItems } = props;
  const RouteIcon = routeButton?.icon;
  return (
    <Flex
      sx={{
        flexShrink: 0,
        alignItems: "center",
        flexDirection: "row",
        gap: "spacing4"
      }}
    >
      {routeButton && RouteIcon ? (
        <Button
          testID="route-action"
          variant="tertiary"
          onPress={routeButton.onClick}
          sx={{ p: 0 }}
        >
          <RouteIcon size={15} />
        </Button>
      ) : null}
      {hasItems ? (
        <Button
          testID={`${groupingKey}-sort-button`}
          variant="tertiary"
          sx={{ p: 0 }}
        >
          <Sliders size={15} />
        </Button>
      ) : null}
      {hasItems && props.canToggleView && viewMode ? (
        <Button
          testID={`${groupingKey}-view-mode-button`}
          variant="tertiary"
          onPress={() =>
            props.setViewMode(viewMode === "compact" ? "detailed" : "compact")
          }
          sx={{ p: 0 }}
        >
          {viewMode === "compact" ? <List size={15} /> : <ViewList size={15} />}
        </Button>
      ) : null}
    </Flex>
  );
}

function Header(props: RouteContainerProps) {
  const { type, routeKey } = props;
  const title = typeof props.title === "string" ? props.title : undefined;
  const query = useSearchStore((store) => store.query);
  const noteContext = useNoteStore((store) => store.context);
  const viewMode = useNoteStore((store) => store.viewMode);
  const setViewMode = useNoteStore((store) => store.setViewMode);
  const hasItems = useHasItems(type, routeKey);
  const { groupingKey, canToggleView } = useGroupingState(
    type,
    routeKey,
    noteContext
  );
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const headerTitle = title || type || "";

  if (type === "notebook" && !hasItems) return null;

  return (
    <Box testID="routeHeader" sx={{ zIndex: 2 }}>
      <Flex
        sx={{
          gap: hasItems ? "spacing6" : "spacing4",
          flexDirection: "column",
          width: "100%",
          px: "spacing6",
          pt: "spacing4",
          pb: "spacing6",
          bg: "background"
        }}
      >
        {type !== "notebook" ? (
          <Flex
            sx={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: "spacing2",
              height: hasItems ? 20 : 32
            }}
          >
            <Text
              testID="route-title"
              numberOfLines={1}
              sx={{
                color: "heading",
                fontSize: "lg",
                fontWeight: "bold",
                minWidth: 0
              }}
            >
              {headerTitle}
            </Text>
            {type !== "notFound" ? (
              <HeaderActions
                groupingKey={groupingKey}
                canToggleView={canToggleView}
                viewMode={viewMode}
                setViewMode={setViewMode}
                routeButton={props.buttons}
                hasItems={hasItems}
              />
            ) : null}
          </Flex>
        ) : null}
        {!hasItems ? (
          <Box sx={{ height: 1, bg: "separator", width: "100%" }} />
        ) : (
          <Flex sx={{ flexDirection: "row", gap: "spacing6" }}>
            <Flex sx={{ flex: 1, flexDirection: "row", height: 40 }}>
              <Input
                testID="search-input"
                variant="clean"
                defaultValue={query}
                placeholder={strings.searchInRoute(headerTitle)}
                onChangeText={(text) => {
                  clearTimeout(debounce.current);
                  debounce.current = setTimeout(
                    () => useSearchStore.setState({ query: text }),
                    250
                  );
                }}
                sx={{
                  flex: 1,
                  m: 0,
                  p: "spacing4",
                  pl: "spacing10",
                  height: 40,
                  fontSize: "xs",
                  color: "paragraph",
                  bg: "background-secondary",
                  borderRadius: "dialog"
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: 10,
                  top: 12.5,
                  pointerEvents: "none"
                }}
              >
                <SearchIcon size={15} color="icon" />
              </Box>
            </Flex>
          </Flex>
        )}
      </Flex>
      {hasItems ? (
        <Box sx={{ mt: "1px", height: 1, bg: "separator", width: "100%" }} />
      ) : null}
    </Box>
  );
}
