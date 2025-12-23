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

import { Flex, Input, Text } from "@theme-ui/components";
import { useRef, useState } from "react";
import { Button } from "../../components/button.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { useTimer } from "../../hooks/use-timer.js";
import { Icon } from "@notesnook/ui";
import { Popup } from "../../toolbar/components/popup.js";
import { Icons } from "../../toolbar/icons.js";
import { ReactNodeViewProps } from "../react/types.js";
import { CodeBlockAttributes } from "./code-block.js";
import Languages from "./languages.json";
import { useThemeEngineStore } from "@notesnook/theme";
import { strings } from "@notesnook/intl";

export function CodeblockComponent(
  props: ReactNodeViewProps<CodeBlockAttributes>
) {
  const { editor, updateAttributes, node, forwardRef } = props;
  const { language, indentLength, indentType, caretPosition } = node.attrs;

  // const [caretPosition, setCaretPosition] = useState<CaretPosition>();
  const elementRef = useRef<HTMLElement>();
  const [isOpen, setIsOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const theme = useThemeEngineStore((store) => store.theme);

  const { enabled, start } = useTimer(1000);

  const languageDefinition = Languages.find(
    (l) => l.filename === language || l.alias?.some((a) => a === language)
  );

  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          borderRadius: "default",
          overflow: "hidden"
        }}
      >
        <Text
          ref={(ref) => {
            elementRef.current = ref ?? undefined;
            forwardRef?.(ref);
          }}
          autoCorrect="off"
          autoCapitalize="none"
          css={theme.codeBlockCSS}
          sx={{
            pre: {
              fontFamily: "inherit !important",
              tabSize: "inherit !important",
              // background: "transparent !important",
              padding: "10px !important",
              margin: "0px !important",
              width: "100%",
              borderRadius: `0px !important`,

              "::selection,*::selection": {
                bg: "background-selected",
                color: "inherit"
              },
              "::-moz-selection,*::-moz-selection": {
                bg: "background-selected",
                color: "inherit"
              }
            },
            fontFamily: "monospace",
            whiteSpace: "pre", // TODO !important
            tabSize: 1,
            position: "relative",
            lineHeight: "20px",
            // bg: "var(--background-secondary)",
            // color: "white",
            overflowX: "hidden",
            display: "flex"
          }}
          spellCheck={false}
        />
        <Flex
          ref={toolbarRef}
          contentEditable={false}
          sx={{
            bg: "var(--background-secondary)",
            alignItems: "center",
            justifyContent: "flex-end",
            borderTop: "1px solid var(--border-secondary)"
          }}
        >
          {caretPosition ? (
            <Text variant={"subBody"} sx={{ mr: 1, mt: "2px" }}>
              {strings.lineColumn(caretPosition.line, caretPosition.column)}{" "}
              {caretPosition.selected
                ? `(${strings.selectedCode(caretPosition.selected)})`
                : ""}
            </Text>
          ) : null}

          <Button
            variant={"icon"}
            sx={{
              p: 1,
              opacity: "1 !important"
            }}
            title={strings.toggleIndentationMode()}
            disabled={!editor.isEditable}
            onClick={() => {
              if (!editor.isEditable) return;
              editor.commands.changeCodeBlockIndentation({
                type: indentType === "space" ? "tab" : "space",
                amount: indentLength
              });
            }}
          >
            <Text variant={"subBody"}>
              {indentType === "space" ? strings.spaces() : strings.tabs()}:{" "}
              {indentLength}
            </Text>
          </Button>

          <Button
            variant={"icon"}
            sx={{
              opacity: "1 !important",
              p: 1,
              mr: 1,
              bg: isOpen ? "background-selected" : "transparent"
            }}
            disabled={!editor.isEditable}
            onClick={() => {
              if (!editor.isEditable) return;

              setIsOpen(true);
            }}
            title={strings.changeLanguage()}
          >
            <Text variant={"subBody"} spellCheck={false}>
              {languageDefinition?.title || "Plaintext"}
            </Text>
          </Button>

          {node.textContent?.length > 0 ? (
            <Button
              variant={"icon"}
              sx={{
                opacity: "1 !important",
                p: 1,
                mr: 1,
                bg: "transparent"
              }}
              onClick={() => {
                editor.storage.copyToClipboard?.(
                  node.textContent,
                  elementRef?.current?.innerHTML
                );
                start();
              }}
              title={strings.copyToClipboard()}
            >
              <Text
                variant={"subBody"}
                spellCheck={false}
                sx={{ color: "codeFg" }}
              >
                {enabled ? strings.copied() : strings.copy()}
              </Text>
            </Button>
          ) : null}
        </Flex>
      </Flex>
      <ResponsivePresenter
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          // NOTE: for some reason the language selection action sheet
          // does not return focus to the last focused position after
          // closing. We have to set focusOnRender=false & manually
          // restore focus. I think this has something to do with custom
          // node views.
          // TRY: perhaps use SelectionBasedReactNodeView?
          editor.commands.focus();
        }}
        focusOnRender={false}
        mobile="sheet"
        desktop="popup"
        position={{
          target: toolbarRef.current || undefined,
          align: "end",
          isTargetAbsolute: true,
          location: "top",
          yOffset: 5
        }}
        title={strings.selectLanguage()}
      >
        <LanguageSelector
          selectedLanguage={languageDefinition?.filename || "Plaintext"}
          onLanguageSelected={(language) => {
            updateAttributes(
              { language },
              { addToHistory: true, preventUpdate: false }
            );
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      </ResponsivePresenter>
    </>
  );
}

type LanguageSelectorProps = {
  onLanguageSelected: (language: string) => void;
  selectedLanguage: string;
  onClose: () => void;
};
function LanguageSelector(props: LanguageSelectorProps) {
  const { onLanguageSelected, selectedLanguage, onClose } = props;
  const [languages, setLanguages] = useState(Languages);

  return (
    <Popup onClose={onClose}>
      <Flex
        sx={{
          flexDirection: "column",
          height: 200,
          width: ["auto", 300],
          bg: "background"
        }}
      >
        <Input
          autoFocus
          placeholder={strings.searchLanguages()}
          sx={{
            width: "auto",
            bg: "background",
            mx: 2,
            p: "7px",
            zIndex: 999,
            mt: 1
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && languages.length > 0) {
              onLanguageSelected(languages[0].filename);
              e.preventDefault();
            } else if (e.key === "Escape") {
              onClose();
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            if (!e.target.value) return setLanguages(Languages);
            const query = e.target.value.toLowerCase();
            setLanguages(
              Languages.filter((lang) => {
                return (
                  lang.title.toLowerCase().indexOf(query) > -1 ||
                  lang.alias?.some(
                    (alias) => alias.toLowerCase().indexOf(query) > -1
                  )
                );
              })
            );
          }}
        />
        <Flex
          sx={{
            flexDirection: "column",
            pt: 1,
            mt: 1,
            overflowY: "auto"
          }}
        >
          {languages.map((lang) => (
            <Button
              key={lang.title}
              variant={"menuitem"}
              sx={{
                textAlign: "left",
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
              onClick={() => onLanguageSelected(lang.filename)}
            >
              <Text variant={"body"}>{lang.title}</Text>
              {selectedLanguage === lang.filename ? (
                <Icon path={Icons.check} size="small" />
              ) : lang.alias ? (
                <Text variant={"subBody"} sx={{ fontSize: "10px" }}>
                  {lang.alias.slice(0, 3).join(", ").toUpperCase()}
                </Text>
              ) : null}
            </Button>
          ))}
        </Flex>
      </Flex>
    </Popup>
  );
}
