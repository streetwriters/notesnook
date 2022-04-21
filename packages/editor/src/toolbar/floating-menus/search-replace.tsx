import { Input } from "@rebass/forms";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flex } from "rebass";
import { MenuPresenter } from "../../components/menu/menu";
import { SearchStorage } from "../../extensions/search-replace";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
import { FloatingMenuProps } from "./types";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const { isSearching, selectedText } = editor.storage
    .searchreplace as SearchStorage;

  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [enableRegex, setEnableRegex] = useState(false);
  const replaceText = useRef("");
  const searchText = useRef("");

  const search = useCallback(
    (term: string) => {
      editor.commands.search(term, {
        matchCase,
        enableRegex,
        matchWholeWord,
      });
    },
    [matchCase, enableRegex, matchWholeWord]
  );

  useEffect(() => {
    search(searchText.current);
  }, [search, matchCase, matchWholeWord, enableRegex]);

  useEffect(() => {
    if (isSearching && selectedText) search(selectedText);
  }, [isSearching, selectedText, search]);

  if (!isSearching) return null;
  return (
    <MenuPresenter
      isOpen
      items={[]}
      onClose={() => {}}
      options={{
        type: "autocomplete",
        position: {
          target:
            document.querySelector<HTMLElement>(".editor-toolbar") || "mouse",
          isTargetAbsolute: true,
          location: "below",
          align: "end",
        },
      }}
    >
      <Popup>
        <Flex sx={{ p: 1, flexDirection: "column" }}>
          <Flex sx={{ alignItems: "start", flexShrink: 0 }}>
            <Flex
              sx={{
                position: "relative",
                mr: 1,
                width: 200,
                alignItems: "center",
              }}
            >
              <Input
                defaultValue={selectedText}
                autoFocus
                sx={{ p: 1 }}
                placeholder="Find"
                onChange={(e) => {
                  searchText.current = e.target.value;
                  search(searchText.current);
                }}
              />
              <Flex
                sx={{
                  position: "absolute",
                  right: 0,
                  mr: 0,
                }}
              >
                <ToolButton
                  sx={{
                    mr: 0,
                  }}
                  toggled={matchCase}
                  title="Match case"
                  id="matchCase"
                  icon="caseSensitive"
                  onClick={() => setMatchCase((s) => !s)}
                  iconSize={14}
                />
                <ToolButton
                  sx={{
                    mr: 0,
                  }}
                  toggled={matchWholeWord}
                  title="Match whole word"
                  id="matchWholeWord"
                  icon="wholeWord"
                  onClick={() => setMatchWholeWord((s) => !s)}
                  iconSize={14}
                />
                <ToolButton
                  sx={{
                    mr: 0,
                  }}
                  toggled={enableRegex}
                  title="Enable regex"
                  id="enableRegex"
                  icon="regex"
                  onClick={() => setEnableRegex((s) => !s)}
                  iconSize={14}
                />
              </Flex>
            </Flex>
            <ToolButton
              toggled={false}
              title="Previous match"
              id="previousMatch"
              icon="previousMatch"
              onClick={() => editor.commands.moveToPreviousResult()}
              sx={{ mr: 0 }}
              iconSize={16}
            />
            <ToolButton
              toggled={false}
              title="Next match"
              id="nextMatch"
              icon="nextMatch"
              onClick={() => editor.commands.moveToNextResult()}
              sx={{ mr: 0 }}
              iconSize={16}
            />
            <ToolButton
              toggled={false}
              title="Close"
              id="close"
              icon="close"
              onClick={() => editor.chain().focus().endSearch().run()}
              iconSize={16}
              sx={{ mr: 0 }}
            />
          </Flex>
          <Flex sx={{ alignItems: "start", flexShrink: 0, mt: 1 }}>
            <Input
              sx={{ p: 1, width: 200, mr: 1 }}
              placeholder="Replace"
              onChange={(e) => (replaceText.current = e.target.value)}
            />
            <ToolButton
              toggled={false}
              title="Replace"
              id="replace"
              icon="replaceOne"
              onClick={() => editor.commands.replace(replaceText.current)}
              sx={{ mr: 0 }}
              iconSize={16}
            />
            <ToolButton
              toggled={false}
              title="Replace all"
              id="replaceAll"
              icon="replaceAll"
              onClick={() => editor.commands.replaceAll(replaceText.current)}
              sx={{ mr: 0 }}
              iconSize={16}
            />
          </Flex>
        </Flex>
      </Popup>
    </MenuPresenter>
  );
}
