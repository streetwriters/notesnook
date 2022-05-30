import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { loadLanguage } from "./loader";
import { refractor } from "refractor/lib/core";
import "prism-themes/themes/prism-dracula.min.css";
import { Theme } from "@notesnook/theme";
import { ThemeProvider } from "emotion-theming";
import { Button, Flex, Text } from "rebass";
import Languages from "./languages.json";
import { PopupPresenter } from "../../components/menu/menu";
import { Input } from "@rebass/forms";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import {
  CodeBlockAttributes,
  toCaretPosition,
  CaretPosition,
  getLines,
} from "./code-block";
import { Transaction } from "prosemirror-state";

export function CodeblockComponent(props: NodeViewProps) {
  const { editor, updateAttributes, node } = props;
  const { language, indentLength, indentType } =
    node.attrs as CodeBlockAttributes;
  const theme = editor.storage.theme as Theme;

  const [isOpen, setIsOpen] = useState(false);
  const [caretPosition, setCaretPosition] = useState<CaretPosition>();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const languageDefinition = Languages.find(
    (l) => l.filename === language || l.alias?.some((a) => a === language)
  );

  useEffect(() => {
    (async function () {
      if (!language || !languageDefinition) {
        updateAttributes({ language: null });
        return;
      }

      const syntax = await loadLanguage(languageDefinition.filename);
      if (!syntax) return;
      refractor.register(syntax);

      updateAttributes({
        language: languageDefinition.filename,
      });
    })();
  }, [language, updateAttributes]);

  useEffect(() => {
    function onSelectionUpdate({
      transaction,
    }: {
      transaction: Transaction<any>;
    }) {
      const position = toCaretPosition(getLines(node), transaction.selection);
      setCaretPosition(position);
    }

    editor.on("selectionUpdate", onSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
    };
  }, [node]);

  return (
    <NodeViewWrapper>
      <ThemeProvider theme={theme}>
        <Flex
          sx={{
            flexDirection: "column",
            borderRadius: "default",
            overflow: "hidden",
          }}
        >
          <Text
            as="pre"
            sx={{
              "div, span.token, span.line-number-widget": {
                fontFamily: "monospace",
                fontSize: "code",
                whiteSpace: "pre !important",
                tabSize: 1,
              },
              position: "relative",
              lineHeight: "20px",
              bg: "codeBg",
              color: "static",
              overflowX: "auto",
              display: "flex",
              px: 2,
              pt: 2,
              pb: 1,
            }}
            spellCheck={false}
          >
            <NodeViewContent as="code" />
          </Text>
          <Flex
            ref={toolbarRef}
            sx={{
              bg: "codeBg",
              alignItems: "center",
              justifyContent: "end",
              borderTop: "1px solid var(--codeBorder)",
            }}
          >
            {caretPosition ? (
              <Text variant={"subBody"} sx={{ mr: 2, color: "codeFg" }}>
                Line {caretPosition.line}, Column {caretPosition.column}{" "}
                {caretPosition.selected
                  ? `(${caretPosition.selected} selected)`
                  : ""}
              </Text>
            ) : null}
            <Button
              variant={"icon"}
              sx={{ p: 1, mr: 1, ":hover": { bg: "codeSelection" } }}
              title="Toggle indentation mode"
              onClick={() => {
                editor.commands.changeCodeBlockIndentation({
                  type: indentType === "space" ? "tab" : "space",
                  length: indentLength,
                });
              }}
            >
              <Text variant={"subBody"} sx={{ color: "codeFg" }}>
                {indentType === "space" ? "Spaces" : "Tabs"}: {indentLength}
              </Text>
            </Button>
            <Button
              variant={"icon"}
              sx={{
                p: 1,
                mr: 1,
                bg: isOpen ? "codeSelection" : "transparent",
                ":hover": { bg: "codeSelection" },
              }}
              onClick={() => setIsOpen(true)}
              title="Change language"
            >
              <Text
                variant={"subBody"}
                spellCheck={false}
                sx={{ color: "codeFg" }}
              >
                {languageDefinition?.title || "Plaintext"}
              </Text>
            </Button>
          </Flex>
        </Flex>
        <PopupPresenter
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            editor.commands.focus();
          }}
          mobile="sheet"
          desktop="menu"
          options={{
            type: "menu",
            position: {
              target: toolbarRef.current || undefined,
              align: "end",
              isTargetAbsolute: true,
              location: "top",
              yOffset: 5,
            },
          }}
        >
          <LanguageSelector
            selectedLanguage={languageDefinition?.filename || "Plaintext"}
            onLanguageSelected={(language) => updateAttributes({ language })}
          />
        </PopupPresenter>
      </ThemeProvider>
    </NodeViewWrapper>
  );
}

type LanguageSelectorProps = {
  onLanguageSelected: (language: string) => void;
  selectedLanguage: string;
};
function LanguageSelector(props: LanguageSelectorProps) {
  const { onLanguageSelected, selectedLanguage } = props;
  const [languages, setLanguages] = useState(Languages);

  return (
    <Flex
      sx={{
        flexDirection: "column",
        height: 200,
        width: 300,
        boxShadow: "menu",
        borderRadius: "default",
        overflowY: "auto",
        bg: "background",
        marginRight: 2,
      }}
    >
      <Input
        autoFocus
        placeholder="Search languages"
        sx={{
          mx: 2,
          width: "auto",
          position: "sticky",
          top: 2,
          bg: "background",
          p: "7px",
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
          pt: 2,
          mt: 1,
        }}
      >
        {languages.map((lang) => (
          <Button
            variant={"menuitem"}
            sx={{
              textAlign: "left",
              py: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() => onLanguageSelected(lang.filename)}
          >
            <Text variant={"body"}>{lang.title}</Text>
            {selectedLanguage === lang.filename ? (
              <Icon path={Icons.check} size="small" />
            ) : lang.alias ? (
              <Text variant={"subBody"} sx={{ fontSize: "10px" }}>
                {lang.alias.slice(0, 3).join(", ")}
              </Text>
            ) : null}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
