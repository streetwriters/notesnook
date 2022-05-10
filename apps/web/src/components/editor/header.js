import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TitleBox from "./title-box";
import { useStore, store } from "../../stores/editor-store";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { Flex } from "rebass";
import IconTag from "../icon-tag";
import { db } from "../../common/db";
import { useMenuTrigger } from "../../hooks/use-menu";

function Header({ readonly }) {
  const title = useStore((store) => store.session.title);
  const id = useStore((store) => store.session.id);
  const tags = useStore((store) => store.session.tags);
  const setTag = useStore((store) => store.setTag);
  const setTitle = useStore((store) => store.setTitle);
  const filterableTags = useMemo(() => {
    return db.tags.all.filter((t) => tags?.every((tag) => tag !== t?.title));
  }, [tags]);

  return (
    <>
      <TitleBox
        readonly={readonly}
        title={title}
        setTitle={(title) => {
          const sessionId = store.get().session.id;
          setTitle(sessionId, title);
        }}
      />

      {!readonly && id && (
        <Flex alignItems="center" flexWrap="wrap" sx={{ lineHeight: 2.5 }}>
          {tags?.map((tag) => (
            <IconTag
              testId={`tag-${tag}`}
              key={tag}
              text={db.tags.alias(tag)}
              icon={Icon.Tag}
              title={`Click to remove`}
              onClick={() => setTag(tag)}
              styles={{ container: { mr: 1 }, text: { fontSize: "body" } }}
            />
          ))}
          <Autosuggest
            sessionId={id}
            filter={(query) =>
              db.lookup.tags(filterableTags, query).slice(0, 10)
            }
            onAdd={(value) => setTag(value)}
            onSelect={(item) => setTag(item.title)}
            onRemove={() => {
              if (tags.length <= 0) return;
              setTag(tags[tags.length - 1]);
            }}
            defaultItems={filterableTags.slice(0, 10)}
          />
        </Flex>
      )}
    </>
  );
}
export default Header;

function Autosuggest({
  sessionId,
  filter,
  onRemove,
  onSelect,
  onAdd,
  defaultItems,
}) {
  const [filtered, setFiltered] = useState([]);
  const inputRef = useRef();
  const { openMenu, closeMenu } = useMenuTrigger();
  const clearInput = useCallback(() => {
    inputRef.current.value = "";
    inputRef.current.focus();
  }, []);

  const getInputValue = useCallback(() => {
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
    },
    [onSelect, onAdd, clearInput]
  );

  useEffect(() => {
    const filterText = getInputValue();
    let items = [];
    if (filterText.length <= 0 && filtered.length <= 0) {
      closeMenu();
      return;
    } else if (filterText.length > 0 && filtered.length <= 0) {
      items.push({
        key: "new",
        title: () => `Create "${filterText}" tag`,
        icon: Icon.Plus,
        onClick: () => onAction("add", filterText),
      });
    } else {
      items.push(
        ...filtered.map((tag) => ({
          key: tag.id,
          title: () => tag.title,
          icon: Icon.Tag,
          onClick: () => onAction("select", tag),
        }))
      );
    }

    openMenu(items, {
      type: "autocomplete",
      positionOptions: {
        relativeTo: inputRef.current,
        absolute: true,
        location: "below",
      },
    });
  }, [filtered, getInputValue, closeMenu, openMenu, onAction]);

  useEffect(() => {
    const text = getInputValue();
    const isFocused = document.activeElement === inputRef.current;
    if (isFocused && !text) setFiltered(defaultItems);
  }, [defaultItems, getInputValue]);

  useEffect(() => {
    setFiltered([]);
  }, [sessionId]);

  return (
    <Input
      ref={inputRef}
      variant="clean"
      width="auto"
      alignSelf="flex-start"
      sx={{ width: "auto", border: "none", p: 0, fontSize: "body" }}
      placeholder="Add a tag..."
      data-test-id="editor-tag-input"
      fontSize="subtitle"
      onFocus={(e) => {
        const text = getInputValue();
        if (!text) setFiltered(defaultItems);
      }}
      onChange={(e) => {
        const { value } = e.target;
        if (!value.length) {
          setFiltered([]);
          return;
        }
        setFiltered(filter(value));
      }}
      onKeyDown={(e) => {
        const text = getInputValue();
        if (e.key === "Enter" && !!text && !filtered.length) {
          onAction("add", text);
        } else if (!text && e.key === "Backspace") {
          onRemove();
          setFiltered([]);
        } else if (e.key === "Escape") {
          setFiltered([]);
          e.stopPropagation();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (e.key === "ArrowDown" && !text) setFiltered(defaultItems);

          e.preventDefault();
        }
      }}
    />
  );
}
