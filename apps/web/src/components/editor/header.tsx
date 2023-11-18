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

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "../../stores/editor-store";
import { Input } from "@theme-ui/components";
import { Tag, Plus } from "../icons";
import { Flex } from "@theme-ui/components";
import IconTag from "../icon-tag";
import { db } from "../../common/db";
import { useMenuTrigger } from "../../hooks/use-menu";
import { MenuItem } from "@notesnook/ui";
import { navigate } from "../../navigation";

type HeaderProps = { readonly: boolean };
function Header(props: HeaderProps) {
  const { readonly } = props;
  const id = useStore((store) => store.session.id);
  const tags = useStore((store) => store.session.tags);
  const setTag = useStore((store) => store.setTag);
  const filterableTags = useMemo(() => {
    return db.tags?.all.filter((t) => tags?.every((tag) => tag !== t?.title));
  }, [tags]);

  return (
    <>
      {id && (
        <Flex
          sx={{ lineHeight: 2.5, alignItems: "center", flexWrap: "wrap" }}
          data-test-id="tags"
        >
          {tags?.map((tag) => (
            <IconTag
              testId={`tag`}
              key={tag}
              text={db.tags?.alias(tag)}
              icon={Tag}
              title={tag}
              onClick={() => {
                const tagItem = db.tags?.tag(tag);
                if (!tagItem) {
                  setTag(tag);
                  return;
                }
                navigate(`/tags/${tagItem.id}`);
              }}
              onDismiss={readonly ? undefined : () => setTag(tag)}
              styles={{ container: { mr: 1 }, text: { fontSize: "body" } }}
            />
          ))}
          {!readonly && (
            <Autosuggest
              sessionId={id}
              filter={(query) =>
                db.lookup?.tags(filterableTags, query).slice(0, 10) || []
              }
              onAdd={(value) => setTag(value)}
              onSelect={(item) => setTag(item.title)}
              onRemove={() => {
                if (tags.length <= 0) return;
                setTag(tags[tags.length - 1]);
              }}
              defaultItems={filterableTags?.slice(0, 10) || []}
            />
          )}
        </Flex>
      )}
    </>
  );
}
export default Header;

type AutosuggestProps = {
  sessionId: string;
  filter: (query: string) => any[];
  onRemove: () => void;
  onSelect: (item: any) => void;
  onAdd: (item: any) => void;
  defaultItems: any[];
};
export function Autosuggest(props: AutosuggestProps) {
  const { sessionId, filter, onRemove, onSelect, onAdd, defaultItems } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const arrowDown = useRef<boolean>();
  const filteredItems = useRef<any[]>([]);
  const { openMenu, closeMenu, isOpen } = useMenuTrigger();
  const clearInput = useCallback(() => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.focus();
  }, []);

  const getInputValue = useCallback(() => {
    if (!inputRef.current) return;
    return inputRef.current.value.trim().toLowerCase();
  }, []);

  const onAction = useCallback(
    (type, value) => {
      if (type === "select") {
        onSelect(value);
      } else if (type === "add") {
        onAdd(value);
      }
      clearInput();
      closeMenu();
    },
    [clearInput, closeMenu, onSelect, onAdd]
  );

  const onOpenMenu = useCallback(
    (filtered: any[]) => {
      const filterText = getInputValue();
      const items: MenuItem[] = [];

      if (!filterText && filtered.length <= 0) {
        closeMenu();
        return;
      }

      const isExactMatch = filtered.some((item) => item.title === filterText);
      if (filterText && !isExactMatch) {
        items.push({
          type: "button",
          key: "new",
          title: `Create "${filterText}" tag`,
          icon: Plus.path,
          onClick: () => onAction("add", filterText)
        });
      }

      if (filtered.length > 0) {
        items.push(
          ...filtered.map((tag) => ({
            type: "button" as const,
            key: tag.id,
            title: tag.alias,
            icon: Tag.path,
            onClick: () => onAction("select", tag)
          }))
        );
      }

      openMenu(items, {
        blocking: true,
        position: {
          target: inputRef.current,
          isTargetAbsolute: true,
          location: "below"
        }
      });
      filteredItems.current = filtered;
    },
    [closeMenu, getInputValue, onAction, openMenu]
  );

  useEffect(() => {
    closeMenu();
  }, [sessionId, closeMenu]);

  return (
    <Input
      ref={inputRef}
      tabIndex={-1}
      variant="clean"
      sx={{
        width: "auto",
        border: "none",
        p: 0,
        fontSize: "body",
        alignSelf: "flex-start"
      }}
      placeholder="Add a tag..."
      data-test-id="editor-tag-input"
      onFocus={() => {
        const text = getInputValue();
        if (!text) onOpenMenu(defaultItems.slice());
        else onOpenMenu([]);
      }}
      onClick={() => {
        const text = getInputValue();
        if (!text) onOpenMenu(defaultItems.slice());
        else onOpenMenu([]);
      }}
      onChange={(e) => {
        const { value } = e.target;
        if (!value.length) {
          closeMenu();
          return;
        }
        onOpenMenu(filter(value));
      }}
      onKeyDown={(e) => {
        const text = getInputValue();
        if (e.key === "Enter" && !!text && isOpen && !arrowDown.current) {
          onAction("add", text);
        } else if (!text && e.key === "Backspace") {
          onRemove();
          closeMenu();
        } else if (e.key === "Escape") {
          arrowDown.current = false;
          closeMenu();
          e.stopPropagation();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          arrowDown.current = true;
          if (e.key === "ArrowDown" && !text) onOpenMenu(defaultItems.slice());

          e.preventDefault();
        } else if (e.key === "Tab") {
          closeMenu();
        }
      }}
    />
  );
}
