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
import { debounce } from "@notesnook/common";
import {
  COLORS,
  ThemeAuthor,
  ThemeDefinition,
  THEME_SCOPES,
  Variants,
  validateTheme,
  ALPHA_COLORS
} from "@notesnook/theme";
import { Button, Flex, Input, Text } from "@theme-ui/components";
import FileSaver from "file-saver";
import { FormEventHandler, useCallback, useRef, useState } from "react";
import { useStore } from "@notesnook/web/src/stores/theme-store";
import { showToast } from "@notesnook/web/src/utils/toast";
import Accordion from "@notesnook/web/src/components/accordion";
import { showFilePicker, readFile } from "@notesnook/web/src/utils/file-picker";
import Field from "@notesnook/web/src/components/field";
import { Close } from "@notesnook/web/src/components/icons";
import { flatten, unflatten } from "../../utils/object";
import { version } from "../../../package.json";
import { writeText } from "clipboard-polyfill";
import { tryParse } from "@notesnook/web/src/utils/parse";
import { loadThemeFromJSON } from "../../utils/theme-loader";

const JSON_SCHEMA_URL =
  "https://raw.githubusercontent.com/streetwriters/notesnook-themes/main/schemas/v1.schema.json";
const ThemeInfoTemplate: Omit<
  ThemeDefinition,
  "authors" | "compatibilityVersion" | "colorScheme" | "scopes"
> = {
  name: "",
  id: "",
  version: 0,
  license: "",
  homepage: "",
  description: "",
  codeBlockCSS: "https://github.com/PrismJS/prism-themes/tree/master/themes"
};

export default function ThemeBuilder() {
  const currentTheme = useStore((state) =>
    state.colorScheme === "dark" ? state.darkTheme : state.lightTheme
  );
  const setTheme = useStore((state) => state.setTheme);
  const [loading, setLoading] = useState(false);
  const currentThemeFlattened = flatten(currentTheme);

  const [authors, setAuthors] = useState(
    currentTheme.authors || [
      {
        name: ""
      }
    ]
  );

  const formRef = useRef<HTMLFormElement>(null);

  const onThemeChanged: FormEventHandler<HTMLDivElement> = useCallback(
    debounce(() => {
      const flattenedTheme = getThemeFromFormData(formRef.current, authors);
      if (!flattenedTheme) return;

      const theme = unflatten(flattenedTheme);
      const result = validateTheme(theme as ThemeDefinition);

      if (result.error) {
        showToast("error", result.error);
        return;
      }

      setTheme({ ...theme } as ThemeDefinition);
    }, 1000),
    [authors]
  );

  const applySearchReplace = useCallback(() => {
    const term = (
      document.getElementById("theme-search-term") as HTMLInputElement
    )?.value;
    const replace = (
      document.getElementById("theme-replace-with") as HTMLInputElement
    )?.value;

    const flattenedTheme = getThemeFromFormData(formRef.current, authors);
    if (!flattenedTheme) return;

    for (const key in flattenedTheme) {
      if (
        typeof flattenedTheme[key] === "string" &&
        flattenedTheme[key].includes(term)
      ) {
        flattenedTheme[key] = flattenedTheme[key].replace(term, replace);
      }
    }
    const theme = unflatten(flattenedTheme);
    const result = validateTheme(theme as ThemeDefinition);

    if (result.error) {
      showToast("error", result.error);
      return;
    }
    // rerender to input values are updated.
    setLoading(true);
    setTheme({ ...theme } as ThemeDefinition);
    setTimeout(() => {
      setLoading(false);
    });
  }, [authors, setTheme]);

  return loading ? null : (
    <>
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          paddingX: "10px"
        }}
      >
        <Text variant="title">Theme Builder {version}</Text>
      </Flex>

      <Flex
        sx={{
          flexDirection: "column",
          rowGap: "10px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "10px",
          paddingX: "10px",
          paddingTop: "10px"
        }}
      >
        <Button
          sx={{ py: "7px" }}
          variant="secondary"
          onClick={() => exportTheme(currentTheme)}
        >
          <Text
            sx={{
              fontSize: "12px"
            }}
          >
            Export theme
          </Text>
        </Button>
        <Button
          sx={{ py: "7px" }}
          variant="secondary"
          onClick={() =>
            writeText(themeToJSON(currentTheme)).then(() =>
              showToast("success", "Copied!")
            )
          }
        >
          <Text
            sx={{
              fontSize: "12px"
            }}
          >
            Copy to clipboard
          </Text>
        </Button>
        <Button
          sx={{ py: "7px" }}
          variant="secondary"
          onClick={async () => {
            const [file] = await showFilePicker({
              acceptedFileTypes: "application/json"
            });
            if (!file) return;
            try {
              setLoading(true);
              const theme = JSON.parse(await readFile(file)) as ThemeDefinition;
              const { error } = validateTheme(theme);
              if (error) return showToast("error", error);
              setTheme(theme);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text
            sx={{
              fontSize: "12px"
            }}
          >
            Load theme file
          </Text>
        </Button>

        <Button
          sx={{ py: "7px" }}
          variant="secondary"
          onClick={async () => {
            try {
              setLoading(true);
              const text = window.prompt("Paste your JSON here");
              if (!text) return null;
              const theme = loadThemeFromJSON(tryParse(text));
              if (!theme) {
                showToast("error", "Please copy a valid JSON theme.");
                return;
              }
              setTheme(theme);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text
            sx={{
              fontSize: "12px"
            }}
          >
            Load from JSON
          </Text>
        </Button>

        <Field
          label="Search & Replace"
          name="Search"
          id="theme-search-term"
          styles={{
            label: {
              fontSize: "12px",
              fontWeight: "normal",
              color: "paragraph-secondary"
            },
            input: {
              marginLeft: "0px",
              marginRight: "0px",
              height: "30px",
              fontSize: "12px"
            }
          }}
          placeholder="Search"
        />

        <Field
          name="Replace"
          id="theme-replace-with"
          styles={{
            label: {
              fontSize: "12px",
              fontWeight: "normal",
              color: "paragraph-secondary"
            },
            input: {
              marginLeft: "0px",
              marginRight: "0px",
              height: "30px",
              fontSize: "12px"
            }
          }}
          placeholder="Replace with"
        />

        <Button
          sx={{ py: "7px" }}
          variant="secondary"
          onClick={applySearchReplace}
        >
          <Text
            sx={{
              fontSize: "12px"
            }}
          >
            Replace
          </Text>
        </Button>
      </Flex>

      <Flex
        as="form"
        key={getThemeKey(currentTheme)}
        id="theme-form"
        ref={formRef}
        onChange={onThemeChanged}
        onSubmit={(event) => {
          event?.preventDefault();
        }}
        sx={{
          flexDirection: "column",
          rowGap: "0.5rem",
          paddingX: "10px"
        }}
      >
        {Object.keys(ThemeInfoTemplate).map((key: string) => {
          return (
            <Field
              key={`${getThemeKey(currentTheme)}-${key}`}
              label={toTitleCase(key)}
              name={key}
              defaultValue={currentThemeFlattened[key]}
              styles={{
                label: {
                  fontSize: "12px",
                  fontWeight: "normal",
                  color: "paragraph-secondary"
                },
                input: {
                  marginLeft: "0px",
                  marginRight: "0px",
                  height: "30px",
                  fontSize: "12px"
                }
              }}
            />
          );
        })}

        <SelectItem
          label="Color Scheme"
          options={[
            {
              title: "Light",
              value: "light"
            },
            {
              title: "Dark",
              value: "dark"
            }
          ]}
          defaultValue={currentThemeFlattened["colorScheme"]}
          name="colorScheme"
          key="colorScheme"
        />
        <SelectItem
          label="Compatibility version"
          name="compatibilityVersion"
          options={[
            {
              title: "1.0",
              value: 1.0
            }
          ]}
          defaultValue={currentThemeFlattened["compatibilityVersion"]}
          key="compatibilityVersion"
        />

        {authors.map((author, index: number) => (
          <Flex
            key={`${getThemeKey(currentTheme)}-${author.name}`}
            sx={{
              flexDirection: "column"
            }}
          >
            <Flex
              style={{
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Text
                sx={{
                  fontSize: "12px",
                  color: "paragraph-secondary",
                  flexShrink: 0,
                  flex: 0.5,
                  marginRight: "20px",
                  mb: 1
                }}
              >
                Author {index + 1}
              </Text>

              {authors.length > 1 ? (
                <Button
                  sx={{
                    height: 25
                  }}
                  onClick={() => {
                    if (authors.length === 1) {
                      console.log("Theme must have at least one author");
                      return;
                    }
                    setAuthors((current) => {
                      const authors = [...current];
                      authors.splice(index, 1);
                      return authors;
                    });
                  }}
                >
                  <Close
                    sx={{
                      width: 15,
                      height: 15
                    }}
                  />
                </Button>
              ) : null}
            </Flex>

            {["name", "email", "url"].map((key) => (
              <>
                <Field
                  key={key}
                  label={toTitleCase(key)}
                  name={`authors.${index}.${key}`}
                  required={key === "name"}
                  defaultValue={author[key as keyof ThemeAuthor]}
                  styles={{
                    container: {
                      ml: 1
                    },
                    label: {
                      fontSize: "12px",
                      fontWeight: "normal",
                      color: "paragraph-secondary"
                    },
                    input: {
                      marginLeft: "0px",
                      marginRight: "0px",
                      height: "30px",
                      fontSize: "12px"
                    }
                  }}
                />
              </>
            ))}
          </Flex>
        ))}

        <Button
          onClick={() => {
            setAuthors((current) => {
              const authors = [...current];
              authors.push({
                name: ""
              });
              return authors;
            });
          }}
          variant="secondary"
          type="submit"
        >
          <Text color="accent">Add author</Text>
        </Button>

        {THEME_SCOPES.map((scopeName) => (
          <>
            <Accordion
              isClosed={false}
              buttonSx={{
                backgroundColor: "transparent",
                borderBottom: "1px solid var(--border)",
                borderRadius: 0,
                p: 0,
                py: 1
              }}
              titleSx={{
                fontSize: "12px",
                color: "paragraph-secondary"
              }}
              title={toTitleCase(scopeName)}
            >
              {Variants.map((variantName) => (
                <>
                  <Accordion
                    isClosed={true}
                    buttonSx={{
                      backgroundColor: "transparent",
                      p: 0,
                      py: 1
                    }}
                    titleSx={{
                      fontSize: "12px",
                      color: "paragraph-secondary",
                      fontWeight: "normal",
                      ml: 1
                    }}
                    title={toTitleCase(variantName)}
                  >
                    {COLORS.map((colorName) => (
                      <Flex
                        key={colorName}
                        sx={{
                          alignItems: "center",
                          width: "100%",
                          justifyContent: "flex-start",
                          ml: 3
                        }}
                      >
                        <Text
                          sx={{
                            fontSize: "12px",
                            color: "paragraph-secondary",
                            flexShrink: 0,
                            flex: 0.5,
                            marginRight: "20px"
                          }}
                        >
                          {colorName}
                        </Text>

                        <Input
                          sx={{
                            fontSize: "12px",
                            height: "25px",
                            borderRadius: 0,
                            flex: 0.4,
                            borderBottom: "1px solid var(--border)",
                            outline: "none",
                            ":hover": {
                              borderWidth: "0px",
                              outline: "none"
                            }
                          }}
                          title={
                            ALPHA_COLORS.includes(colorName)
                              ? `Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)`
                              : `Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)`
                          }
                          required={scopeName === "base"}
                          name={`scopes.${scopeName}.${variantName}.${colorName}`}
                          defaultValue={
                            currentThemeFlattened[
                              `scopes.${scopeName}.${variantName}.${colorName}`
                            ]
                          }
                          onChange={(event) => {
                            onChangeColor(
                              event.target,
                              event.target
                                .nextElementSibling as HTMLInputElement
                            );
                          }}
                        />
                        <Input
                          type="color"
                          onChange={(event) => {
                            onChangeColor(
                              event.target,
                              event.target
                                .previousElementSibling as HTMLInputElement
                            );
                          }}
                          title={
                            ALPHA_COLORS.includes(colorName)
                              ? `Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)`
                              : `Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)`
                          }
                          defaultValue={convertColor(
                            currentThemeFlattened[
                              `scopes.${scopeName}.${variantName}.${colorName}`
                            ]
                          )}
                          sx={{
                            borderRadius: 0,
                            borderBottom: "1px solid var(--border)",
                            outline: "none",
                            width: "20px",
                            height: "20px",
                            padding: "0px"
                          }}
                        />
                      </Flex>
                    ))}
                  </Accordion>
                </>
              ))}
            </Accordion>
          </>
        ))}
      </Flex>
    </>
  );
}

function SelectItem(props: {
  options: { title: string; value: string | number }[];
  defaultValue: string | number;
  onChange?: (value: string) => void;
  label: string;
  name: string;
}) {
  return (
    <Flex
      sx={{
        flexDirection: "column"
      }}
    >
      <Text
        sx={{
          fontSize: "12px",
          fontWeight: "normal",
          color: "paragraph-secondary"
        }}
        mb={1}
      >
        {props.label}
      </Text>
      <select
        style={{
          backgroundColor: "var(--background)",
          outline: "none",
          border: "1px solid var(--border-secondary)",
          borderRadius: "5px",
          color: "var(--paragraph)",
          height: "33px",
          fontSize: "12px"
        }}
        name={props.name}
        defaultValue={props.defaultValue}
        onChange={(e) => {
          const value = (e.target as HTMLSelectElement).value;
          props.onChange?.(value);
        }}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.title}
          </option>
        ))}
      </select>
    </Flex>
  );
}

function exportTheme(theme: ThemeDefinition) {
  FileSaver.saveAs(
    new Blob([themeToJSON(theme)], {
      type: "text/plain"
    }),
    `${theme.id}.json`
  );
  const confirmed = window.confirm(
    "Do you also want to download code-block.css for this theme?"
  );
  if (confirmed) {
    FileSaver.saveAs(
      new Blob([theme.codeBlockCSS], {
        type: "text/plain"
      }),
      `code-block.css`
    );
  }
}

function themeToJSON(theme: ThemeDefinition) {
  return JSON.stringify(
    {
      $schema: JSON_SCHEMA_URL,
      ...theme,
      codeBlockCSS: undefined
    },
    undefined,
    2
  );
}

const onChangeColor = (target: HTMLInputElement, sibling: HTMLInputElement) => {
  const value = target.value;
  if ((sibling as HTMLInputElement).value !== value) {
    (sibling as HTMLInputElement).value = convertColor(target.value);
  }
};

function convertColor(color: string) {
  return color && color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;
}

function getThemeFromFormData(
  form: HTMLFormElement | undefined | null,
  authors: ThemeAuthor[]
) {
  if (!form) return;
  const body = new FormData(form);
  const flattenedThemeRaw = {
    ...Object.fromEntries(body.entries()),
    ...flatten({ authors: [...authors] })
  };

  const flattenedTheme: { [name: string]: any } = {};

  for (const key in flattenedThemeRaw) {
    if (flattenedThemeRaw[key] === "" || !flattenedThemeRaw[key]) continue;
    if (key === "compatibilityVersion" || key === "version") {
      flattenedTheme[key] = parseFloat(flattenedThemeRaw[key]);
    } else {
      flattenedTheme[key] = flattenedThemeRaw[key];
    }
  }
  return flattenedTheme;
}

function toTitleCase(value: string) {
  return (
    value.slice(0, 1).toUpperCase() +
    value
      .slice(1)
      .replace(/([A-Z]+)/g, " $1")
      .replace(/([A-Z][a-z])/g, " $1")
  );
}

function getThemeKey(theme: ThemeDefinition) {
  return `${theme.id}-${theme.version}-${theme.compatibilityVersion}`;
}
