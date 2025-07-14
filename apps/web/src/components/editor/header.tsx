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

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { Input } from "@theme-ui/components";
import { Tag as TagIcon, Plus } from "../icons";
import { Flex } from "@theme-ui/components";
import IconTag from "../icon-tag";
import { db } from "../../common/db";
import { useMenuTrigger } from "../../hooks/use-menu";
import { MenuItem } from "@notesnook/ui";
import { navigate } from "../../navigation";
import { Tag } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { isFeatureAvailable } from "@notesnook/common";
import { showFeatureNotAllowedToast } from "../../common/toasts";

type HeaderProps = { readonly: boolean; id: string };
function Header(props: HeaderProps) {
  const { readonly, id } = props;
  const activeSession = useEditorStore((store) =>
    store.getActiveSession(["default", "readonly"])
  );
  const tags = activeSession?.tags || [];
  const noteId = activeSession?.note.id;

  const setTag = useCallback(async function (
    noteId: string,
    tags: Tag[],
    value: string
  ) {
    const oldTag = tags.find((t) => t.title === value);
    if (oldTag) {
      await db.relations.unlink(oldTag, { type: "note", id: noteId });
    } else {
      let id = (await db.tags.find(value))?.id;
      if (!id) {
        const result = await isFeatureAvailable("tags");
        if (!result.isAllowed) return showFeatureNotAllowedToast(result);
        id = await db.tags.add({ title: value });
      }
      if (!id) return;
      await db.relations.add({ id, type: "tag" }, { type: "note", id: noteId });
      await useTagStore.getState().refresh();
    }
    await useNoteStore.getState().refresh();
  },
  []);

  return (
    <>
      <Flex
        sx={{
          lineHeight: 2.5,
          alignItems: "center",
          flexWrap: "wrap",
          opacity: !noteId ? 0.5 : 1
        }}
        data-test-id="tags"
      >
        {tags?.map((tag) => (
          <IconTag
            testId={`tag`}
            key={tag.id}
            text={tag.title}
            icon={TagIcon}
            onClick={() => {
              useAppStore.getState().setNavigationTab("tags");
              navigate(`/tags/${tag.id}`);
            }}
            onDismiss={
              readonly || !noteId
                ? undefined
                : () => setTag(noteId, tags, tag.title)
            }
            styles={{ container: { mr: 1 }, text: { fontSize: "body" } }}
          />
        ))}
        {!readonly && tags ? (
          <Autosuggest
            sessionId={id}
            filter={(query) => db.lookup.tags(query).items(10)}
            disabled={!noteId}
            toMenuItems={(filtered, reset, query) => {
              const items: MenuItem[] = [];
              if (!noteId) return items;
              const isExactMatch =
                !!query && filtered.some((item) => item.title === query);
              if (query && !isExactMatch) {
                items.push({
                  type: "button",
                  key: "new",
                  title: `Create "${query}" tag`,
                  icon: Plus.path,
                  onClick: () => setTag(noteId, tags, query).finally(reset)
                });
              }

              if (filtered.length > 0) {
                items.push(
                  ...filtered.map((item) => ({
                    type: "button" as const,
                    key: item.id,
                    title: item.title,
                    icon: TagIcon.path,
                    onClick: () =>
                      setTag(noteId, tags, item.title).finally(reset)
                  }))
                );
              }

              return items;
            }}
            onAdd={(value) => {
              if (!noteId) return;
              setTag(noteId, tags, value);
            }}
            onRemove={() => {
              if (!noteId) return;
              if (tags.length <= 0) return;
              setTag(noteId, tags, tags[tags.length - 1].title);
            }}
            defaultItems={() =>
              db.tags.all.limit(10).items(undefined, {
                sortBy: "title",
                sortDirection: "desc"
              })
            }
          />
        ) : null}
      </Flex>
    </>
  );
}
export default Header;

type AutosuggestProps<T> = {
  sessionId: string;
  filter: (query: string) => Promise<T[]>;
  onRemove: () => void;
  onAdd: (text: string) => void;
  toMenuItems: (filtered: T[], reset: () => void, query?: string) => MenuItem[];
  defaultItems: () => Promise<T[]>;
  disabled?: boolean;
};
export function Autosuggest<T>(props: AutosuggestProps<T>) {
  const { sessionId, filter, onRemove, onAdd, defaultItems, toMenuItems } =
    props;
  const inputRef = useRef<HTMLInputElement>(null);
  const arrowDown = useRef<boolean>();
  const { openMenu, closeMenu, isOpen } = useMenuTrigger();
  const clearInput = useCallback(() => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.focus();
  }, []);

  const getInputValue = useCallback(() => {
    if (!inputRef.current) return;
    return inputRef.current.value.trim();
  }, []);

  const reset = useCallback(() => {
    clearInput();
    closeMenu();
    if (inputRef.current) inputRef.current.focus();
  }, [clearInput, closeMenu]);

  const onOpenMenu = useCallback(
    async (filtered: T[]) => {
      const filterText = getInputValue();

      if (!filterText && filtered.length <= 0) {
        closeMenu();
        return;
      }

      openMenu(toMenuItems(filtered, reset, filterText), {
        blocking: true,
        forceCustom: true,
        position: {
          target: inputRef.current,
          isTargetAbsolute: true,
          location: "below"
        }
      });
    },
    [closeMenu, getInputValue, openMenu, reset, toMenuItems]
  );

  useEffect(() => {
    closeMenu();
  }, [sessionId, closeMenu]);

  return (
    <Input
      ref={inputRef}
      tabIndex={-1}
      variant="clean"
      disabled={props.disabled}
      sx={{
        width: "auto",
        border: "none",
        p: 0,
        fontSize: "body",
        alignSelf: "flex-start"
      }}
      placeholder={strings.addATag()}
      data-test-id="editor-tag-input"
      onFocus={async () => {
        const text = getInputValue();
        if (!text) onOpenMenu(await defaultItems());
        else closeMenu();
      }}
      onClick={async () => {
        const text = getInputValue();
        if (!text) onOpenMenu(await defaultItems());
        else closeMenu();
      }}
      onChange={async (e) => {
        const { value } = e.target;
        if (!value.length) {
          closeMenu();
          return;
        }
        onOpenMenu(await filter(value));
      }}
      onKeyDown={async (e) => {
        const text = getInputValue();
        if (e.key === "Enter" && !!text && isOpen && !arrowDown.current) {
          onAdd(text);
          reset();
        } else if (!text && e.key === "Backspace") {
          onRemove();
          closeMenu();
        } else if (e.key === "Escape") {
          arrowDown.current = false;
          closeMenu();
          e.stopPropagation();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          arrowDown.current = true;
          if (e.key === "ArrowDown" && !text) onOpenMenu(await defaultItems());

          e.preventDefault();
        } else if (e.key === "Tab") {
          closeMenu();
        }
      }}
    />
  );
}
