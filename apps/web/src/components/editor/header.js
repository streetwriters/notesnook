import React, { useCallback, useEffect, useRef, useState } from "react";
import TitleBox from "./title-box";
import { useStore } from "../../stores/editor-store";
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
  const setSession = useStore((store) => store.setSession);

  return (
    <>
      <TitleBox
        readonly={readonly}
        title={title}
        changeInterval={100}
        setTitle={(title) =>
          setSession((state) => {
            state.session.title = title;
          })
        }
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
            getData={() => db.tags.all}
            getFields={(item) => [db.tags.alias(item.id)]}
            limit={10}
            onAdd={(value) => setTag(value)}
            onSelect={(item) => setTag(item.title)}
            onRemove={() => {
              if (tags.length <= 0) return;
              setTag(tags[tags.length - 1]);
            }}
            customFilter={(item) => tags.indexOf(item.title) === -1}
            defaultItems={() => db.tags.all.slice(0, 10)}
          />
        </Flex>
      )}
    </>
  );
}
export default Header;

function Autosuggest({
  getData,
  getFields,
  customFilter,
  onRemove,
  limit,
  onSelect,
  onAdd,
  sx,
  defaultItems,
}) {
  const [filtered, setFiltered] = useState([]);
  const inputRef = useRef();
  const { openMenu, closeMenu } = useMenuTrigger();
  const clearInput = useCallback(() => {
    inputRef.current.value = "";
  }, []);

  const getInputValue = useCallback(() => {
    return inputRef.current.value.trim().toLowerCase();
  }, []);

  const onAction = useCallback(
    (type, value) => {
      clearInput();
      if (type === "select") {
        onSelect(value);
      } else if (type === "add") {
        onAdd(value);
      }
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
        if (!e.target.value.trim()) setFiltered(defaultItems());
      }}
      onBlur={() => setFiltered([])}
      onChange={(e) => {
        const { value } = e.target;
        if (!value.length) {
          setFiltered([]);
          return;
        }
        let filtered = getData().filter((d) => {
          const fields = getFields(d);
          return (
            fields.some((field) => {
              return field.toLowerCase().startsWith(value.toLowerCase());
            }) &&
            (!customFilter || customFilter(d))
          );
        });
        filtered = filtered.slice(0, limit);
        setFiltered(filtered);
      }}
      onKeyDown={(e) => {
        const text = getInputValue();
        if (e.key === "Enter" && !!text && !filtered.length) {
          onAction("add", text);
        } else if (!text && e.key === "Backspace") {
          onRemove();
          closeMenu();
        } else if (e.key === "Escape") {
          closeMenu();
          e.stopPropagation();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (e.key === "ArrowDown" && !text) setFiltered(defaultItems());

          e.preventDefault();
        }
      }}
    />
  );
}
