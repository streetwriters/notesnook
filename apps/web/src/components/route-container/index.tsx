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

import { PropsWithChildren, useEffect, useRef } from "react";
import { Box, Button, Text } from "@theme-ui/components";
import {
  Close,
  AddReminder,
  Menu,
  SearchIcon,
  Sliders,
  ViewList
} from "../icons";
import { useStore as useSearchStore } from "../../stores/search-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { useStore as useTrashStore } from "../../stores/trash-store";
import useMobile from "../../hooks/use-mobile";
import { showGroupOptionsMenu } from "../group-header";
import { GroupingKey } from "@notesnook/core";
import { debounce, usePromise } from "@notesnook/common";
import Field from "../field";
import { strings } from "@notesnook/intl";
import { RouteResult } from "../../navigation/types";
import { CREATE_BUTTON_MAP } from "../../common";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { Context } from "../list-container/types";

export type RouteContainerButtons = {
  search?: {
    title: string;
  };
  back?: {
    title: string;
    onClick: () => void;
  };
  create?: {
    title: string;
    onClick: () => void;
  };
};

export type RouteContainerProps = RouteResult & {
  routeKey?: string;
};
function RouteContainer(props: PropsWithChildren<RouteContainerProps>) {
  const { children } = props;
  return (
    <>
      <Header {...props} />
      {children}
    </>
  );
}

export default RouteContainer;

function useHasItems(
  type: RouteContainerProps["type"],
  routeKey?: RouteContainerProps["routeKey"]
) {
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
  type: RouteContainerProps["type"],
  routeKey: RouteContainerProps["routeKey"],
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
  const refresh =
    type === "reminders"
      ? useReminderStore.getState().refresh
      : type === "trash"
      ? useTrashStore.getState().refresh
      : routeKey === "home"
      ? useNoteStore.getState().refresh
      : useNoteStore.getState().refreshContext;
  const context =
    type === "notebook" || type === "notes" ? noteContext : undefined;
  const canToggleView = groupingKey === "home" || groupingKey === "notes";

  return { groupingKey, refresh, context, canToggleView };
}

function Header(props: RouteContainerProps) {
  const { type, routeKey } = props;
  const titlePromise = usePromise<string | undefined>(
    () => (typeof props.title === "string" ? props.title : props.title?.()),
    [props.title]
  );
  const isMobile = useMobile();
  const isSearching = useSearchStore((store) => store.isSearching);
  const query = useSearchStore((store) => store.query);
  const noteContext = useNoteStore((store) => store.context);
  const viewMode = useNoteStore((store) => store.viewMode);
  const setViewMode = useNoteStore((store) => store.setViewMode);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasItems = useHasItems(type, routeKey);
  const { groupingKey, refresh, context, canToggleView } = useGroupingState(
    type,
    routeKey,
    noteContext
  );

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== query) {
      inputRef.current.value = query || "";
    }
  }, [query]);

  useEffect(() => {
    if (isSearching) inputRef.current?.focus();
  }, [isSearching]);

  const headerTitle =
    titlePromise.status === "fulfilled" ? titlePromise.value || type : type;

  return (
    <Box
      sx={{
        zIndex: 2
      }}
      className="route-container-header search-container"
      data-test-id="routeHeader"
      data-header={headerTitle}
    >
      <Box
        sx={{
          display: "flex",
          gap: "spacing6",
          flexDirection: "column",
          width: "100%",
          px: "spacing6",
          pt: "spacing4",
          pb: "spacing6",
          borderBottom: "1px solid",
          borderColor: "separator",
          bg: "background"
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <Text
            sx={{
              color: "heading",
              fontSize: "lg",
              fontWeight: "bold",
              lineHeight: 1
            }}
          >
            {headerTitle}
          </Text>
          {type !== "notFound" && hasItems && (
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: "spacing4"
              }}
            >
              <Button
                variant="tertiary"
                title="Group and sort"
                data-test-id={`${groupingKey}-sort-button`}
                onClick={() =>
                  showGroupOptionsMenu(groupingKey, refresh, {
                    isSearching,
                    context
                  })
                }
                sx={{ p: 0 }}
              >
                <Sliders size={15} color="icon-secondary" />
              </Button>
              {canToggleView && viewMode && (
                <Button
                  variant="tertiary"
                  title={
                    viewMode === "compact"
                      ? "Switch to detailed view"
                      : "Switch to compact view"
                  }
                  data-test-id={`${groupingKey}-view-mode-button`}
                  onClick={() =>
                    setViewMode(viewMode === "compact" ? "detailed" : "compact")
                  }
                  sx={{ p: 0 }}
                >
                  <ViewList size={15} color="icon-secondary" />
                </Button>
              )}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            position: "relative",
            width: "100%"
          }}
        >
          {!isMobile && (
            <SearchIcon
              size={15}
              color="icon"
              sx={{
                left: "spacing4",
                pointerEvents: "none",
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 1
              }}
            />
          )}
          <Field
            inputRef={inputRef}
            data-test-id="search-input"
            id="search"
            name="search"
            type="text"
            variant="clean"
            sx={{
              gap: 0,
              m: 0,
              width: "100%"
            }}
            styles={{
              input: {
                m: 0,
                p: "spacing4",
                pl: "spacing10",
                fontSize: "xs",
                color: "paragraph-secondary",
                bg: "background-secondary",
                borderRadius: "dialog",
                "::placeholder": {
                  textAlign: "start"
                },
                "& + .rightActions #search-action-button": {
                  opacity: query ? 1 : 0
                },
                "&:focus + .rightActions #search-action-button": {
                  opacity: 1
                }
              }
            }}
            defaultValue={query}
            placeholder={strings.searchInRoute(headerTitle)}
            onChange={debounce(
              (e) => useSearchStore.setState({ query: e.target.value }),
              250
            )}
            onKeyUp={(e) => {
              if (e.key === "Escape") useSearchStore.getState().resetSearch();
              else
                useSearchStore.setState({
                  isSearching: true,
                  searchType: type
                });
            }}
            leftActions={[
              {
                icon: Menu,
                hidden: !isMobile,
                id: "hamburger-menu",
                onClick: () => {
                  AppEventManager.publish(AppEvents.toggleSideMenu, true);
                }
              }
            ]}
            rightActions={[
              {
                icon: Close,
                id: "search-action-button",
                testId: "search-button",
                onClick: () => {
                  if (inputRef.current) inputRef.current.value = "";
                  useSearchStore.getState().resetSearch();
                },
                hidden: !query
              },
              ...(type === "reminders"
                ? [
                    {
                      icon: AddReminder,
                      testId: "create-reminder-button",
                      ...CREATE_BUTTON_MAP.reminders
                    }
                  ]
                : [])
            ]}
          />
        </Box>
      </Box>
    </Box>
  );
}
