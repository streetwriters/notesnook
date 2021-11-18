import React, { useRef, useState } from "react";
import TitleBox from "./title-box";
import { useStore } from "../../stores/editor-store";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { Button, Flex, Text } from "rebass";
import IconTag from "../icon-tag";
import { db } from "../../common/db";

function Header() {
  const title = useStore((store) => store.session.title);
  const id = useStore((store) => store.session.id);
  const tags = useStore((store) => store.session.tags);
  const setTag = useStore((store) => store.setTag);
  const setSession = useStore((store) => store.setSession);

  return (
    <>
      <TitleBox
        title={title}
        changeInterval={500}
        setTitle={(title) =>
          setSession((state) => {
            state.session.title = title;
          })
        }
      />

      {id && (
        <Flex alignItems="center" flexWrap="wrap" sx={{ lineHeight: 2.5 }}>
          {tags.map((tag) => (
            <IconTag
              testId={`tag-${tag}`}
              key={tag}
              text={tag}
              icon={Icon.Tag}
              title={`Click to remove`}
              onClick={() => setTag(tag)}
              styles={{ text: { fontSize: "body" } }}
            />
          ))}
          <Autosuggest
            sx={{ ml: 1 }}
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
            renderSuggestion={(item, isSelected) => (
              <>
                <Icon.Tag size={12} sx={{ flexShrink: 0 }} />
                <Text
                  variant="subtitle"
                  fontWeight="body"
                  ml={1}
                  sx={{ textOverflow: "ellipsis" }}
                >
                  {db.tags.alias(item.id)}
                </Text>
              </>
            )}
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
  renderSuggestion,
  limit,
  onAdd,
  onSelect,
  sx,
}) {
  const [filtered, setFiltered] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef();
  return (
    <Flex
      flex="1 1 auto"
      flexDirection="column"
      sx={{ position: "relative", ...sx }}
      onBlur={(e) => {
        if (
          e.relatedTarget &&
          e.relatedTarget.classList?.contains("suggestion-item")
        )
          return;
        setFiltered([]);
      }}
    >
      <Input
        ref={inputRef}
        variant="clean"
        width="auto"
        alignSelf="flex-start"
        sx={{ width: "auto", border: "none", p: 0, fontSize: "body" }}
        placeholder="Add a tag..."
        data-test-id="editor-tag-input"
        fontSize="subtitle"
        onChange={(e) => {
          const { value } = e.target;
          if (!value.length) {
            setFiltered([]);
            return;
          }
          const filtered = getData().filter((d) => {
            const fields = getFields(d);
            return (
              fields.some((field) => {
                return field.startsWith(value.toLowerCase());
              }) &&
              (!customFilter || customFilter(d))
            );
          });
          setFiltered(filtered.slice(0, limit));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (selectedIndex > -1) {
              onSelect(filtered[selectedIndex]);
            } else {
              onAdd(e.target.value.toLowerCase());
            }
            e.target.value = "";
            setFiltered([]);
            setSelectedIndex(-1);
          } else if (e.target.value === "" && e.key === "Backspace") {
            onRemove();
          } else if (e.key === "Escape") {
            setFiltered([]);
          } else if (e.key === "ArrowDown") {
            setSelectedIndex((i) => {
              if (++i >= filtered.length) return 0;
              return i;
            });
            e.preventDefault();
          } else if (e.key === "ArrowUp") {
            setSelectedIndex((i) => {
              if (--i < 0) return filtered.length - 1;
              return i;
            });
            e.preventDefault();
          }
        }}
      />
      {filtered.length ? (
        <Flex
          flexDirection="column"
          sx={{
            position: "absolute",
            top: 35,
            border: "1px solid",
            borderColor: "border",
            borderRadius: "default",
            boxShadow: "0px 4px 10px 0px #00000022",
            zIndex: 2,
            height: 200,
            width: 150,
            overflowX: "hidden",
          }}
          bg="background"
        >
          {filtered.map((item, index) => (
            <Button
              variant="menuitem"
              className="suggestion-item"
              key={item.id}
              onClick={(e) => {
                onSelect(item);
                inputRef.current.value = "";
                setFiltered([]);
              }}
              m={0}
              lineHeight="initial"
              display="flex"
              justifyContent="start"
              alignItems="center"
              bg={selectedIndex === index ? "hover" : "transparent"}
              title={`Press enter or click to add this tag`}
              px={2}
            >
              {renderSuggestion(item)}
            </Button>
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
}
