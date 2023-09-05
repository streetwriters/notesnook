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

import ShareExtension from "@ammarahmed/react-native-share-extension";
import { getPreviewData } from "@flyerhq/react-native-link-preview";
import { formatBytes } from "@notesnook/common";
import { isImage } from "@notesnook/core/dist/utils/filename";
import { parseHTML } from "@notesnook/core/dist/utils/html-parser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import RNFetchBlob from "react-native-blob-util";
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import isURL from "validator/lib/isURL";
import { db } from "../app/common/database";
import Storage from "../app/common/database/storage";
import { eSendEvent } from "../app/services/event-manager";
import { FILE_SIZE_LIMIT, IMAGE_SIZE_LIMIT } from "../app/utils/constants";
import { getElevationStyle } from "../app/utils/elevation";
import { eOnLoadNote } from "../app/utils/events";
import { NoteBundle } from "../app/utils/note-bundle";
import { Editor } from "./editor";
import { Search } from "./search";
import { initDatabase, useShareStore } from "./store";
import { useThemeColors } from "@notesnook/theme";

const getLinkPreview = (url) => {
  return getPreviewData(url, 5000);
};
async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    return sanitize(html, site);
  } catch (e) {
    return "";
  }
}

function makeHtmlFromUrl(url) {
  return `<a href='${url}' target='_blank'>${url}</a>`;
}

function makeHtmlFromPlainText(text) {
  if (!text) return "";

  return `<p>${text
    .replace(/[\n]+/g, "\n")
    .replace(/(?:\r\n|\r|\n)/g, "</p><p>")}</p>`;
}

function getBaseUrl(site) {
  var url = site.split("/").slice(0, 3).join("/");
  return url;
}

function wrapTablesWithDiv(document) {
  const tables = document.getElementsByTagName("table");
  for (let table of tables) {
    table.setAttribute("contenteditable", "true");
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "false");
    div.innerHTML = table.outerHTML;
    div.classList.add("table-container");
    table.replaceWith(div);
  }
  return document;
}

let elementBlacklist = [
  "script",
  "button",
  "input",
  "textarea",
  "style",
  "form",
  "link",
  "head",
  "nav",
  "iframe",
  "canvas",
  "select",
  "dialog",
  "footer"
];

function removeInvalidElements(document) {
  let elements = document.querySelectorAll(elementBlacklist.join(","));
  for (let element of elements) {
    element.remove();
  }
  return document;
}

function replaceSrcWithAbsoluteUrls(document, baseUrl) {
  let images = document.querySelectorAll("img");

  for (var i = 0; i < images.length; i++) {
    let img = images[i];
    let url = getBaseUrl(baseUrl);
    let src = img.getAttribute("src");
    if (src.startsWith("/")) {
      if (src.startsWith("//")) {
        src = src.replace("//", "https://");
      } else {
        src = url + src;
      }
    }
    if (src.startsWith("data:")) {
      img.remove();
    } else {
      img.setAttribute("src", src);
    }
  }

  return document;
}

function fixCodeBlocks(document) {
  let elements = document.querySelectorAll("code,pre");

  for (let element of elements) {
    element.classList.add(".hljs");
  }
  return document;
}

function sanitize(html, baseUrl) {
  let parser = parseHTML(html);
  parser = wrapTablesWithDiv(parser);
  parser = removeInvalidElements(parser);
  parser = replaceSrcWithAbsoluteUrls(parser, baseUrl);
  parser = fixCodeBlocks(parser);
  let htmlString = parser.body.outerHTML;
  htmlString = htmlString + `<hr>${makeHtmlFromUrl(baseUrl)}`;
  return htmlString;
}

let defaultNote = {
  title: null,
  id: null,
  content: {
    type: "tiptap",
    data: null
  }
};

const modes = {
  1: {
    type: "text",
    title: "Plain text",
    icon: "card-text-outline"
  },
  2: {
    type: "clip",
    title: "Web clip",
    icon: "web"
  },
  3: {
    type: "link",
    title: "Link",
    icon: "link"
  }
};

const ShareView = ({ quicknote = false }) => {
  const { colors } = useThemeColors();
  const appendNote = useShareStore((state) => state.appendNote);
  const [note, setNote] = useState({ ...defaultNote });
  const noteContent = useRef("");
  const [loading, setLoading] = useState(false);
  const [loadingExtension, setLoadingExtension] = useState(true);
  const [rawData, setRawData] = useState({
    type: null,
    value: null
  });
  const [mode, setMode] = useState(1);
  const keyboardHeight = useRef(0);
  const { width, height } = useWindowDimensions();
  const insets =
    Platform.OS === "android"
      ? { top: StatusBar.currentHeight }
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useSafeAreaInsets();
  const [searchMode, setSearchMode] = useState(null);
  const [rawFiles, setRawFiles] = useState([]);

  const [kh, setKh] = useState(0);
  globalThis["IS_SHARE_EXTENSION"] = true;
  const onKeyboardDidShow = (event) => {
    let height = Dimensions.get("window").height - event.endCoordinates.screenY;
    keyboardHeight.current = height;
    setKh(height);
  };

  const onKeyboardDidHide = () => {
    keyboardHeight.current = 0;
    setKh(0);
  };

  useEffect(() => {
    let keyboardDidShow = Keyboard.addListener(
      "keyboardDidShow",
      onKeyboardDidShow
    );
    let keyboardDidHide = Keyboard.addListener(
      "keyboardDidHide",
      onKeyboardDidHide
    );
    return () => {
      keyboardDidShow?.remove();
      keyboardDidHide?.remove();
    };
  }, []);

  const showLinkPreview = async (note, link) => {
    let _note = note;
    _note.content.data = makeHtmlFromUrl(link);
    try {
      let preview = await getLinkPreview(link);
      _note.title = preview.title;
    } catch (e) {
      console.log(e);
    }
    return note;
  };

  const loadData = useCallback(async () => {
    try {
      defaultNote.content.data = null;
      setNote({ ...defaultNote });
      const data = await ShareExtension.data();

      if (!data || data.length === 0) {
        setRawData({
          value: ""
        });
        return;
      }
      let note = { ...defaultNote };
      for (let item of data) {
        if (item.type === "text") {
          setRawData(item);
          if (isURL(item.value)) {
            note = await showLinkPreview(note, item.value);
          } else {
            note.content.data = makeHtmlFromPlainText(item.value);
          }
          noteContent.current = note.content.data;
        } else {
          const user = await db.user.getUser();
          if (user && user.subscription.type !== 0) {
            if (
              (isImage(item.type) && item.size > IMAGE_SIZE_LIMIT) ||
              (!isImage(item.type) && item.size > FILE_SIZE_LIMIT)
            )
              continue;

            setRawFiles((files) => {
              const index = files.findIndex((file) => file.name === item.name);
              if (index === -1) {
                files.push(item);
                return [...files];
              } else {
                return files;
              }
            });
          }
        }
      }
      onLoad();

      setNote({ ...note });
    } catch (e) {
      console.error(e);
    }
  }, [onLoad]);

  const onLoad = useCallback(() => {
    eSendEvent(eOnLoadNote + "shareEditor", {
      id: null,
      content: {
        type: "tiptap",
        data: noteContent.current
      },
      forced: true
    });
  }, []);

  useEffect(() => {
    (async () => {
      await initDatabase();
      setLoadingExtension(false);
      loadData();
      useShareStore.getState().restore();
    })();
  }, [loadData]);

  const close = async () => {
    setNote({ ...defaultNote });
    setLoadingExtension(true);
    if (quicknote) {
      ShareExtension.openURL("ShareMedia://MainApp");
    } else {
      ShareExtension.close();
    }
  };

  const onPress = async () => {
    setLoading(true);
    if (!noteContent.current && rawFiles.length === 0) {
      setLoading(false);
      return;
    }
    if (appendNote && !db.notes.note(appendNote.id)) {
      useShareStore.getState().setAppendNote(null);
      Alert.alert("The note you are trying to append to has been deleted.");
      return;
    }

    let _note;
    if (appendNote && db.notes.note(appendNote.id)) {
      let raw = await db.content.raw(appendNote.contentId);
      _note = {
        content: {
          data: (raw?.data || "") + noteContent.current,
          type: "tiptap"
        },
        id: appendNote.id,
        sessionId: Date.now()
      };
    } else {
      _note = { ...note };
      _note.tags = useShareStore.getState().selectedTags || [];

      _note.content.data = noteContent.current;
      _note.sessionId = Date.now();
    }

    await NoteBundle.createNotes({
      files: rawFiles,
      note: _note,
      notebooks: useShareStore.getState().selectedNotebooks
    });

    try {
      if (!globalThis["IS_MAIN_APP_RUNNING"]) {
        await db.sync(false, false);
      } else {
        console.log("main app running, skipping sync");
      }
    } catch (e) {
      console.log(e, e.stack);
    }

    await Storage.write("notesAddedFromIntent", "added");
    close();
    setLoading(false);
  };

  const changeMode = async (m) => {
    setMode(m);

    setLoading(true);
    try {
      if (m === 2) {
        let html = await sanitizeHtml(rawData.value);
        setNote((note) => {
          note.content.data = html;
          noteContent.current = html;
          onLoad();
          return { ...note };
        });
      } else {
        let html = isURL(rawData.value)
          ? makeHtmlFromUrl(rawData.value)
          : makeHtmlFromPlainText(rawData.value);
        setNote((note) => {
          note.content.data = html;
          noteContent.current = html;
          onLoad();
          return { ...note };
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onLoadEditor = useCallback(() => {
    Storage.write("shareExtensionOpened", "opened");
    loadData();
  }, [loadData]);

  const onRemoveFile = (item) => {
    const index = rawFiles.findIndex((file) => file.name === item.name);
    if (index > -1) {
      setRawFiles((state) => {
        const files = [...state];
        files.splice(index);
        return files;
      });
      RNFetchBlob.fs.unlink(item.value).catch(console.log);
    }
  };

  const WrapperView = Platform.OS === "android" ? View : ScrollView;

  return loadingExtension ? null : (
    <SafeAreaView
      style={{
        width: width > 500 ? 500 : width,
        height: quicknote ? height : height - kh,
        alignSelf: "center",
        justifyContent: quicknote ? "flex-start" : "flex-end"
      }}
    >
      {quicknote && !searchMode ? (
        <View
          style={{
            width: "100%",
            backgroundColor: colors.primary.background,
            height: 50 + insets.top,
            paddingTop: insets.top,
            ...getElevationStyle(1),
            marginTop: -insets.top,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Button
            type="action"
            icon="close"
            iconColor={colors.secondary.icon}
            onPress={() => {
              if (searchMode) {
                setSearchMode(null);
              } else {
                close();
              }
            }}
            style={{
              width: 50,
              height: 50,
              marginBottom: 0
            }}
            iconSize={25}
          />

          <Text
            style={{
              color: colors.primary.paragraph,
              fontSize: 17
            }}
          >
            Quick note
          </Text>

          <Button
            type="action"
            icon="check"
            iconColor={colors.primary.accent}
            onPress={onPress}
            style={{
              width: 50,
              height: 50,
              marginBottom: 0
            }}
            iconSize={25}
          />
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (searchMode) {
              setSearchMode(null);
            } else {
              close();
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute"
          }}
        >
          <View
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              opacity: 0.01
            }}
          />
          <View />
        </TouchableOpacity>
      )}

      {searchMode ? (
        <Search
          quicknote={quicknote}
          getKeyboardHeight={() => keyboardHeight.current}
          mode={searchMode}
          close={() => {
            setSearchMode(null);
          }}
        />
      ) : null}

      <WrapperView
        style={{
          paddingVertical: 12,
          backgroundColor: colors.primary.background,
          display: searchMode ? "none" : "flex",
          borderTopRightRadius: Platform.OS === "ios" ? 10 : 15,
          borderTopLeftRadius: Platform.OS === "ios" ? 10 : 15,
          maxHeight: Platform.OS === "android" ? undefined : "100%"
        }}
      >
        <View
          style={{
            maxHeight: "100%"
            //paddingHorizontal: 12
          }}
        >
          <View
            style={{
              width: "100%"
            }}
          >
            <View
              style={{
                minHeight: 100,
                backgroundColor: colors.primary.background,
                overflow: "hidden"
              }}
            >
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  paddingBottom: 12,
                  borderBottomColor: colors.secondary.background,
                  paddingHorizontal: 12
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.primary.heading
                  }}
                >
                  Save to Notesnook
                </Text>

                <Button
                  title="Done"
                  style={{
                    backgroundColor: colors.primary.accent,
                    height: Platform.OS === "ios" ? 35 : 40,
                    paddingHorizontal: 15,
                    marginBottom: 0
                  }}
                  loading={loading}
                  iconColor={colors.primary.accentForeground}
                  onPress={onPress}
                  textColor={colors.primary.accentForeground}
                  textStyle={{
                    fontSize: 16,
                    marginLeft: 0
                  }}
                />
              </View>

              {rawFiles?.length > 0 ? (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: colors.secondary.background
                  }}
                >
                  <Text
                    style={{ color: colors.primary.paragraph, marginBottom: 6 }}
                  >
                    Attaching {rawFiles.length} file(s):
                  </Text>
                  <ScrollView horizontal>
                    {rawFiles.map((item) =>
                      isImage(item.type) ? (
                        <TouchableOpacity
                          onPress={() => onRemoveFile(item)}
                          key={item.name}
                          activeOpacity={0.9}
                        >
                          <Image
                            source={{
                              uri:
                                Platform.OS === "android"
                                  ? `file://${item.value}`
                                  : item.value
                            }}
                            style={{
                              width: 100,
                              height: 100,
                              borderRadius: 5,
                              backgroundColor: "black",
                              marginRight: 6
                            }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          key={item.name}
                          source={{
                            uri: `file://${item.value}`
                          }}
                          onPress={() => onRemoveFile(item)}
                          style={{
                            borderRadius: 5,
                            backgroundColor: colors.secondary.background,
                            flexDirection: "row",
                            borderWidth: 1,
                            borderColor: colors.primary.border,
                            alignItems: "center",
                            paddingVertical: 5,
                            paddingHorizontal: 8,
                            marginRight: 6
                          }}
                          resizeMode="cover"
                        >
                          <Icon
                            color={colors.primary.icon}
                            size={15}
                            name="file"
                          />

                          <Text
                            style={{
                              marginLeft: 4,
                              color: colors.primary.paragraph,
                              paddingRight: 8,
                              fontSize: 12
                            }}
                          >
                            {item.name} ({formatBytes(item.size)})
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </ScrollView>

                  <Text
                    style={{
                      color: colors.secondary.paragraph,
                      marginTop: 6,
                      fontSize: 11
                    }}
                  >
                    Tap to remove an attachment.
                  </Text>
                </View>
              ) : null}
              <View
                style={{
                  width: "100%",
                  height: rawFiles.length > 0 ? 100 : 200,
                  paddingBottom: 15,
                  marginBottom: 10,
                  borderBottomColor: colors.secondary.background,
                  borderBottomWidth: 1
                }}
              >
                <SafeAreaProvider
                  style={{
                    flex: 1,
                    paddingTop: 10
                  }}
                >
                  {!loadingExtension && (
                    <Editor
                      onLoad={onLoadEditor}
                      onChange={(html) => {
                        noteContent.current = html;
                      }}
                    />
                  )}
                </SafeAreaProvider>
              </View>

              {appendNote ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.secondary.paragraph,
                    paddingHorizontal: 12,
                    marginBottom: 10,
                    flexWrap: "wrap"
                  }}
                >
                  Above content will append to{" "}
                  <Text
                    style={{
                      color: colors.primary.accent,
                      fontWeight: "bold"
                    }}
                  >
                    {`"${appendNote.title}"`}
                  </Text>{" "}
                  . Click on {'"New note"'} to create a new note.
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 12,
                  width: "100%",
                  alignItems: "center"
                }}
              >
                <Text
                  style={{
                    color: colors.primary.paragraph,
                    marginRight: 10
                  }}
                >
                  Clip Mode:
                </Text>
                {rawData.value && isURL(rawData.value) ? (
                  <Button
                    color="transparent"
                    icon={mode === 2 ? "radiobox-marked" : "radiobox-blank"}
                    onPress={() => changeMode(2)}
                    title={modes[2].title}
                    iconSize={16}
                    fontSize={14}
                    iconColor={
                      mode == 2 ? colors.primary.accent : colors.secondary.icon
                    }
                    textColor={
                      mode == 2 ? colors.primary.accent : colors.secondary.icon
                    }
                    style={{
                      paddingHorizontal: 0,
                      height: 30,
                      marginRight: 12,
                      marginBottom: 0
                    }}
                  />
                ) : null}
                <Button
                  color="transparent"
                  icon={mode === 1 ? "radiobox-marked" : "radiobox-blank"}
                  onPress={() => changeMode(1)}
                  title={modes[1].title}
                  iconSize={16}
                  fontSize={14}
                  iconColor={
                    mode == 1 ? colors.primary.accent : colors.secondary.icon
                  }
                  textColor={
                    mode == 1 ? colors.primary.accent : colors.secondary.icon
                  }
                  style={{ paddingHorizontal: 0, height: 30, marginBottom: 0 }}
                />
              </View>
            </View>
          </View>

          <View
            style={{
              width: "100%",
              borderRadius: 10,
              flexDirection: "column",
              marginTop: 10,
              alignSelf: "center",
              alignItems: "center",
              paddingHorizontal: 12
            }}
          >
            <Button
              color={colors.primary.background}
              onPress={() => {
                useShareStore.getState().setAppendNote(null);
              }}
              icon="plus"
              iconSize={18}
              iconColor={
                !appendNote ? colors.primary.accent : colors.secondary.icon
              }
              title="New note"
              textColor={
                !appendNote ? colors.primary.accent : colors.secondary.icon
              }
              type="button"
              textStyle={{
                fontSize: 15
              }}
              style={{
                paddingHorizontal: 12,
                height: 45,
                width: "100%",
                marginRight: 0,
                borderWidth: 1,
                borderColor: colors.secondary.background,
                justifyContent: "flex-start"
              }}
            />

            <Button
              color={colors.primary.bg}
              onPress={() => {
                setSearchMode("appendNote");
              }}
              icon="text-short"
              iconSize={18}
              iconColor={
                appendNote ? colors.primary.accent : colors.secondary.icon
              }
              title={`Append to a note`}
              textColor={colors.secondary.paragraph}
              type="button"
              textStyle={{
                fontSize: 15
              }}
              style={{
                paddingHorizontal: 12,
                height: 45,
                width: "100%",
                marginRight: 0,
                borderWidth: 1,
                borderColor: colors.secondary.background,
                justifyContent: "flex-start"
              }}
            />

            {!appendNote ? (
              <AddTags
                onPress={() => {
                  setSearchMode("selectTags");
                }}
              />
            ) : null}

            {!appendNote ? (
              <AddNotebooks
                onPress={() => {
                  setSearchMode("selectNotebooks");
                }}
              />
            ) : null}
          </View>

          <View
            style={{
              height: Platform.isPad ? 150 : Platform.OS === "ios" ? 110 : 0
            }}
          />
        </View>
      </WrapperView>
    </SafeAreaView>
  );
};

const AddNotebooks = ({ onPress }) => {
  const { colors } = useThemeColors();
  const notebooks = useShareStore((state) => state.selectedNotebooks);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        width: "100%",
        marginRight: 0,
        borderWidth: 1,
        borderColor: colors.secondary.background,
        justifyContent: "center",
        borderRadius: 5,
        marginBottom: 10,
        paddingVertical: 10,
        paddingTop: 5
      }}
    >
      {!notebooks || !notebooks.length ? (
        <>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 5
            }}
          >
            <Icon
              name="notebook-outline"
              size={20}
              style={{
                marginRight: 10
              }}
              color={colors.secondary.icon}
            />
            <Text
              style={{
                color: colors.secondary.icon,
                fontSize: 15
              }}
            >
              Add to notebook
            </Text>
          </View>
        </>
      ) : (
        <View
          style={{
            flexWrap: "wrap",
            width: "100%",
            flexDirection: "row"
          }}
        >
          {notebooks.map((item) => (
            <Text
              style={{
                color: colors.secondary.icon,
                marginRight: 5,
                fontSize: 14,
                borderRadius: 4,
                paddingHorizontal: 8,
                backgroundColor: colors.secondary.background,
                paddingVertical: 5,
                marginTop: 5
              }}
              onPress={() => {
                const index = notebooks.findIndex(
                  (nb) => nb.id === item.id && nb.type === item.type
                );
                const selectedNotebooks = [...notebooks];
                selectedNotebooks.splice(index, 1);
                useShareStore
                  .getState()
                  .setSelectedNotebooks(selectedNotebooks);
              }}
              key={item.id}
            >
              <Icon
                name={item.type === "topic" ? "bookmark" : "notebook-outline"}
                size={15}
              />{" "}
              {item.title}
            </Text>
          ))}

          <Text
            style={{
              color: colors.primary.accent,
              marginRight: 5,
              fontSize: 14,
              borderRadius: 4,
              paddingHorizontal: 8,
              backgroundColor: colors.secondary.background,
              paddingVertical: 5,
              marginTop: 5
            }}
            onPress={() => {
              onPress();
            }}
            key="$add-more"
          >
            <Icon name="plus" size={16} /> Add more
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const AddTags = ({ onPress }) => {
  const { colors } = useThemeColors();
  const tags = useShareStore((state) => state.selectedTags);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        minHeight: 45,
        width: "100%",
        marginRight: 0,
        borderWidth: 1,
        borderColor: colors.secondary.background,
        justifyContent: "center",
        borderRadius: 5,
        marginBottom: 10
      }}
    >
      {!tags || !tags.length ? (
        <>
          <View
            style={{
              width: "100%",
              flexDirection: "row"
            }}
          >
            <Icon
              name="pound"
              size={20}
              style={{
                marginRight: 10
              }}
              color={colors.secondary.icon}
            />
            <Text
              style={{
                color: colors.secondary.icon,
                fontSize: 15
              }}
            >
              Add tags
            </Text>
          </View>
        </>
      ) : (
        <View
          style={{
            flexWrap: "wrap",
            width: "100%",
            flexDirection: "row"
          }}
        >
          {tags.map((tag) => (
            <Text
              style={{
                color: colors.secondary.icon,
                marginRight: 5,
                fontSize: 14,
                borderRadius: 4,
                paddingHorizontal: 8,
                backgroundColor: colors.secondary.background,
                paddingVertical: 5
              }}
              onPress={() => {
                const index = tags.indexOf(tag);
                const selectedTags = [...tags];
                selectedTags.splice(index, 1);
                useShareStore.getState().setSelectedTags(selectedTags);
              }}
              key={tag}
            >
              #{tag}
            </Text>
          ))}

          <Text
            style={{
              color: colors.primary.accent,
              marginRight: 5,
              fontSize: 14,
              borderRadius: 4,
              paddingHorizontal: 8,
              backgroundColor: colors.secondary.background,
              paddingVertical: 5
            }}
            onPress={() => {
              onPress();
            }}
            key="$add-tag"
          >
            <Icon name="plus" size={17} />
            Add tag
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const Button = ({
  title,
  onPress,
  color,
  loading,
  style,
  textStyle,
  icon,
  iconSize = 22,
  type = "button",
  iconColor = "gray",
  textColor = "white",
  fontSize = 18
}) => {
  const types = {
    action: {
      style: {
        width: 60,
        height: 60,
        borderRadius: 100,
        minWidth: 0,
        paddingHorizontal: 0
      },
      textStyle: {}
    },
    button: {
      style: {
        height: 50,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginBottom: 10,
        paddingHorizontal: 20
      },
      textStyle: {}
    },
    rounded: {
      style: {
        marginRight: 15,
        height: 30,
        borderRadius: 100,
        paddingHorizontal: 6,
        marginTop: -2.5
      },
      textStyle: {
        fontSize: 12,
        marginLeft: 5
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: color,
          height: 50,
          borderRadius: 5,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          marginBottom: 10,
          paddingHorizontal: 20
        },
        { ...types[type].style, ...style }
      ]}
    >
      {loading ? <ActivityIndicator color={iconColor} /> : null}

      {icon && !loading ? (
        <Icon name={icon} size={iconSize} color={iconColor || "white"} />
      ) : null}

      {title ? (
        <Text
          style={[
            {
              fontSize: fontSize || 18,
              color: textColor,
              marginLeft: loading ? 10 : 5
            },
            types[type].textStyle,
            textStyle
          ]}
        >
          {title}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default ShareView;
