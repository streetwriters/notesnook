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
import { isImage } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import RNFetchBlob from "react-native-blob-util";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import isURL from "validator/lib/isURL";
import { DatabaseLogger, db } from "../app/common/database";
import { Storage } from "../app/common/database/storage";
import { Button } from "../app/components/ui/button";
import Heading from "../app/components/ui/typography/heading";
import Paragraph from "../app/components/ui/typography/paragraph";
import { useDBItem } from "../app/hooks/use-db-item";
import { eSendEvent } from "../app/services/event-manager";
import { FILE_SIZE_LIMIT, IMAGE_SIZE_LIMIT } from "../app/utils/constants";
import { eOnLoadNote } from "../app/utils/events";
import { NoteBundle } from "../app/utils/note-bundle";
import { SIZE } from "../app/utils/size";
import { AddNotebooks } from "./add-notebooks";
import { AddTags } from "./add-tags";
import { Editor } from "./editor";
import { HtmlLoadingWebViewAgent, fetchHandle } from "./fetch-webview";
import { Search } from "./search";
import { initDatabase, useShareStore } from "./store";

const getLinkPreview = (url) => {
  return getPreviewData(url, 5000);
};
async function sanitizeHtml(site) {
  try {
    let html = await fetchHandle.current?.processUrl(site);
    return html;
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

const ShareView = () => {
  const { colors } = useThemeColors();
  const appendNoteId = useShareStore((state) => state.appendNote);
  const [note, setNote] = useState({ ...defaultNote });
  const noteContent = useRef("");
  const noteTitle = useRef("");
  const [loading, setLoading] = useState(false);
  const [loadingExtension, setLoadingExtension] = useState(true);
  const [rawData, setRawData] = useState({
    type: null,
    value: null
  });
  const inputRef = useRef(null);
  const [mode, setMode] = useState(1);
  const keyboardHeight = useRef(0);
  const { width, height } = useWindowDimensions();
  const [loadingPage, setLoadingPage] = useState(false);
  const editorRef = useRef();
  const [searchMode, setSearchMode] = useState(null);
  const [rawFiles, setRawFiles] = useState([]);

  const [kh, setKh] = useState(0);
  const [compress, setCompress] = useState(true);
  globalThis["IS_SHARE_EXTENSION"] = true;
  const onKeyboardDidShow = (event) => {
    let height = Dimensions.get("screen").height - event.endCoordinates.screenY;
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

  const loadData = useCallback(
    async (isEditor) => {
      try {
        if (noteContent.current) {
          onLoad();
          return;
        }
        defaultNote.content.data = null;
        setNote({ ...defaultNote });
        const data = await ShareExtension.data();

        if (!data || data.length === 0) {
          setRawData({
            value: ""
          });
          if (isEditor) {
            setTimeout(() => {
              editorRef.current?.focus();
            }, 300);
          }
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
          } else if (item.type === "extras") {
            for (const key in item) {
              if (!key) continue;
              if (key.includes("TITLE") || key.includes("SUBJECT")) {
                note.title = item[key];
                noteTitle.current = note.title;
                inputRef.current?.setNativeProps?.({
                  text: noteTitle.current
                });
              }
              if (key.includes("TEXT") && !note.content.data) {
                note.content.data = item[key];
                noteContent.current = item[key];
              }
            }
          } else {
            const user = await db.user.getUser();
            if (user && user.subscription.type !== 0) {
              if (
                (isImage(item.type) && item.size > IMAGE_SIZE_LIMIT) ||
                (!isImage(item.type) && item.size > FILE_SIZE_LIMIT)
              ) {
                continue;
              }

              setRawFiles((files) => {
                const index = files.findIndex(
                  (file) => file.name === item.name
                );
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
    },
    [onLoad]
  );

  const onLoad = useCallback(() => {
    console.log(noteContent.current, "current...");
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
      try {
        await initDatabase();
        setLoadingExtension(false);
        loadData();
        useShareStore.getState().restore();
      } catch (e) {
        DatabaseLogger.error(e);
      }
    })();
  }, [loadData]);

  const close = async () => {
    setNote({ ...defaultNote });
    setLoadingExtension(true);
    ShareExtension.close();
  };

  const onPress = async () => {
    setLoading(true);
    if (!noteContent.current && rawFiles.length === 0 && !noteTitle.current) {
      setLoading(false);
      return;
    }

    let noteData;
    if (appendNoteId) {
      if (!(await db.notes.exists(appendNoteId))) {
        useShareStore.getState().setAppendNote(null);
        Alert.alert("The note you are trying to append to has been deleted.");
        setLoading(false);
        return;
      }

      const note = await db.notes.note(appendNoteId);
      let rawContent = await db.content.get(note.contentId);

      noteData = {
        content: {
          data: (rawContent?.data || "") + noteContent.current,
          type: "tiptap"
        },
        id: note.id,
        sessionId: Date.now()
      };
    } else {
      noteData = { ...note };
      noteData.content.data = noteContent.current;
      noteData.sessionId = Date.now();
      noteData.title = noteTitle.current;
    }

    try {
      await NoteBundle.createNotes({
        files: rawFiles,
        note: noteData,
        notebooks: useShareStore.getState().selectedNotebooks,
        tags: useShareStore.getState().selectedTags,
        compress
      });

      if (!globalThis["IS_MAIN_APP_RUNNING"]) {
        await db.sync({ type: "send", force: false });
      } else {
        console.log("main app running, skipping sync");
      }
    } catch (e) {
      DatabaseLogger.error(e, "Error adding notes from share extension");
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
        setLoadingPage(true);
        setTimeout(async () => {
          let html = await sanitizeHtml(rawData.value);
          noteContent.current = html;
          setLoadingPage(false);
          onLoad();
          setNote((note) => {
            note.content.data = html;
            return { ...note };
          });
        }, 300);
      } else {
        setLoadingPage(false);
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
    loadData(true);
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
        height: height - kh,
        alignSelf: "center",
        justifyContent: "flex-end",
        overflow: "hidden"
      }}
    >
      {loadingPage ? <HtmlLoadingWebViewAgent /> : null}

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

      {searchMode ? (
        <Search
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
        <ScrollView>
          <View
            style={{
              maxHeight: "100%"
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
                    paddingHorizontal: 12,
                    gap: 10
                  }}
                >
                  {appendNoteId ? (
                    <Heading
                      style={{
                        flexShrink: 1,
                        flexGrow: 1,
                        fontFamily: "OpenSans-SemiBold",
                        fontSize: SIZE.lg,
                        paddingBottom: 0,
                        paddingTop: 0
                      }}
                    >
                      Save note
                    </Heading>
                  ) : (
                    <TextInput
                      placeholder="Enter note title"
                      ref={inputRef}
                      style={{
                        flexShrink: 1,
                        flexGrow: 1,
                        fontFamily: "OpenSans-SemiBold",
                        fontSize: SIZE.lg,
                        paddingBottom: 0,
                        paddingTop: 0,
                        color: colors.primary.heading
                      }}
                      onChangeText={(value) => {
                        noteTitle.current = value;
                      }}
                      defaultValue={noteTitle.current}
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        editorRef.current.focus();
                      }}
                    />
                  )}
                  <Button
                    title="Done"
                    type="accent"
                    loading={loading}
                    onPress={onPress}
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
                    <Paragraph
                      style={{ marginBottom: 6 }}
                      color={colors.primary.paragraph}
                    >
                      Attaching {rawFiles.length} file(s):
                    </Paragraph>
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

                            <Paragraph
                              size={SIZE.xs}
                              color={colors.primary.paragraph}
                              style={{
                                marginLeft: 4,
                                paddingRight: 8
                              }}
                            >
                              {item.name} ({formatBytes(item.size)})
                            </Paragraph>
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>

                    <Paragraph
                      color={colors.secondary.paragraph}
                      size={SIZE.xs}
                      style={{
                        marginTop: 6
                      }}
                    >
                      Tap to remove an attachment.
                    </Paragraph>
                    {rawFiles.some((item) => isImage(item.type)) ? (
                      <TouchableOpacity
                        activeOpacity={1}
                        style={{
                          flexDirection: "row",
                          alignSelf: "center",
                          alignItems: "center",
                          width: "100%",
                          marginTop: 6
                        }}
                        onPress={() => {
                          setCompress(!compress);
                        }}
                      >
                        <Icon
                          size={20}
                          name={
                            compress
                              ? "checkbox-marked"
                              : "checkbox-blank-outline"
                          }
                          color={
                            compress
                              ? colors.primary.accent
                              : colors.primary.icon
                          }
                        />

                        <Text
                          style={{
                            flexShrink: 1,
                            marginLeft: 3,
                            fontSize: 12
                          }}
                        >
                          Compress image(s) (recommended)
                        </Text>
                      </TouchableOpacity>
                    ) : null}
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
                      paddingTop: 10,
                      justifyContent: loadingPage ? "center" : undefined,
                      alignItems: loadingPage ? "center" : undefined
                    }}
                  >
                    {!loadingExtension && !loadingPage ? (
                      <>
                        <Editor
                          editorRef={editorRef}
                          onLoad={onLoadEditor}
                          onChange={(html) => {
                            noteContent.current = html;
                          }}
                        />
                      </>
                    ) : (
                      <>
                        {loadingPage ? (
                          <>
                            <ActivityIndicator color={colors.primary.accent} />
                            <Paragraph>Preparing web clip...</Paragraph>
                          </>
                        ) : null}
                      </>
                    )}
                  </SafeAreaProvider>
                </View>

                {appendNoteId ? (
                  <AppendNote
                    id={appendNoteId}
                    onLoad={(title) => {
                      if (!noteTitle.current) {
                        noteTitle.current = title;
                        inputRef.current?.setNativeProps?.({
                          text: noteTitle.current
                        });
                      }
                    }}
                  />
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 12,
                    width: "100%",
                    alignItems: "center"
                  }}
                >
                  <Paragraph
                    style={{
                      marginRight: 10
                    }}
                  >
                    Clip Mode:
                  </Paragraph>
                  {rawData.value && isURL(rawData.value) ? (
                    <Button
                      type={mode === 2 ? "inverted" : "transparent"}
                      icon={mode === 2 ? "radiobox-marked" : "radiobox-blank"}
                      onPress={() => changeMode(2)}
                      title={modes[2].title}
                      height={30}
                      style={{
                        paddingHorizontal: 6
                      }}
                    />
                  ) : null}
                  <Button
                    type={mode === 1 ? "inverted" : "transparent"}
                    icon={mode === 1 ? "radiobox-marked" : "radiobox-blank"}
                    onPress={() => changeMode(2)}
                    title={modes[1].title}
                    height={30}
                    style={{
                      paddingHorizontal: 6
                    }}
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
                paddingHorizontal: 12,
                gap: 10
              }}
            >
              <Button
                icon="plus"
                onPress={() => {
                  useShareStore.getState().setAppendNote(null);
                }}
                type={!appendNoteId ? "transparent" : "plain"}
                title="New note"
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
                icon="text-short"
                onPress={() => {
                  setSearchMode("appendNote");
                }}
                type={appendNoteId ? "transparent" : "plain"}
                title={`Append to a note`}
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

              {!appendNoteId ? (
                <AddTags
                  onPress={() => {
                    setSearchMode("selectTags");
                  }}
                />
              ) : null}

              {!appendNoteId ? (
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
        </ScrollView>
      </WrapperView>
    </SafeAreaView>
  );
};

const AppendNote = ({ id, onLoad }) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(id, "note");

  useEffect(() => {
    if (item?.title) {
      onLoad?.(item.title);
    }
  }, [item?.title, onLoad]);

  return !item ? null : (
    <Paragraph
      size={SIZE.xs}
      color={colors.secondary.paragraph}
      style={{
        paddingHorizontal: 12,
        marginBottom: 10,
        flexWrap: "wrap"
      }}
    >
      Above content will append to{" "}
      <Paragraph
        size={SIZE.xs}
        style={{
          color: colors.primary.accent,
          fontWeight: "bold"
        }}
      >
        {`"${item.title}"`}
      </Paragraph>{" "}
      . Click on {'"New note"'} to create a new note.
    </Paragraph>
  );
};

export default ShareView;
