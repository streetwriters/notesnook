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

import ShareExtension, {
  ShareItem
} from "@ammarahmed/react-native-share-extension";
import { getPreviewData } from "@flyerhq/react-native-link-preview";
import {
  formatBytes,
  isFeatureAvailable,
  useIsFeatureAvailable
} from "@notesnook/common";
import { isImage } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardEvent,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import RNFetchBlob from "react-native-blob-util";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets
} from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import isURL from "validator/lib/isURL";
import { DatabaseLogger, db } from "../common/database";
import { Storage } from "../common/database/storage";
import { Button } from "../components/ui/button";
import Heading from "../components/ui/typography/heading";
import Paragraph from "../components/ui/typography/paragraph";
import { useDBItem } from "../hooks/use-db-item";
import { eSendEvent } from "../services/event-manager";
import { eOnLoadNote } from "../utils/events";
import { NoteBundle } from "../utils/note-bundle";
import { defaultBorderRadius, AppFontSize } from "../utils/size";
import { AddNotebooks } from "./add-notebooks";
import { AddTags } from "./add-tags";
import { Editor, EditorRef } from "./editor";
import { HtmlLoadingWebViewAgent, fetchHandle } from "./fetch-webview";
import { Search } from "./search";
import { initDatabase, useShareStore } from "./store";
import { isTablet } from "react-native-device-info";
import { NotesnookModule } from "../utils/notesnook-module";

const getLinkPreview = (url: string) => {
  return getPreviewData(url, 5000);
};
async function sanitizeHtml(site: string) {
  try {
    let html = await fetchHandle.current?.processUrl(site);
    return html;
  } catch (e) {
    return "";
  }
}

function makeHtmlFromUrl(url: string) {
  return `<a href='${url}' target='_blank'>${url}</a>`;
}

function makeHtmlFromPlainText(text: string) {
  if (!text) return "";

  return `<p>${text
    .replace(/[\n]+/g, "\n")
    .replace(/(?:\r\n|\r|\n)/g, "</p><p>")}</p>`;
}

type DefaultNote = {
  title?: string;
  id?: string;
  sessionId?: number;
  content: {
    type: "tiptap";
    data?: string;
  };
};

let defaultNote: DefaultNote = {
  title: "",
  id: undefined,
  content: {
    type: "tiptap",
    data: ""
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

declare global {
  var IS_SHARE_EXTENSION: boolean;
  var IS_MAIN_APP_RUNNING: boolean;
}

const ShareView = () => {
  const { colors } = useThemeColors();
  const gesturesEnabled = NotesnookModule.isGestureNavigationEnabled();
  const appendNoteId = useShareStore((state) => state.appendNote);
  const [note, setNote] = useState({ ...defaultNote });
  const noteContent = useRef<string>(undefined);
  const noteTitle = useRef<string>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingExtension, setLoadingExtension] = useState(true);
  const fullQualityImages = useIsFeatureAvailable("fullQualityImages");
  const [rawData, setRawData] = useState<{
    type?: string;
    value?: string;
  }>({});
  const inputRef = useRef<TextInput>(null);
  const [mode, setMode] = useState(1);
  const keyboardHeightRef = useRef(0);
  const { width, height } = useWindowDimensions();
  const [loadingPage, setLoadingPage] = useState(false);
  const editorRef = useRef<EditorRef>(null);
  const [searchMode, setSearchMode] = useState<
    "appendNote" | "selectTags" | "selectNotebooks" | null
  >(null);
  const [rawFiles, setRawFiles] = useState<ShareItem[]>([]);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [compress, setCompress] = useState(true);
  globalThis["IS_SHARE_EXTENSION"] = true;
  const onKeyboardDidShow = (event: KeyboardEvent) => {
    let height = Dimensions.get("screen").height - event.endCoordinates.screenY;
    keyboardHeightRef.current = height;
    setKeyboardHeight(height);
  };

  const onKeyboardDidHide = () => {
    keyboardHeightRef.current = 0;
    setKeyboardHeight(0);
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

  useEffect(() => {
    if (!fullQualityImages?.isAllowed) {
      setCompress(true);
    }
  }, [fullQualityImages]);

  const showLinkPreview = async (note: DefaultNote, link: string) => {
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

  const loadData = useCallback(
    async (isEditor: boolean) => {
      try {
        if (noteContent.current) {
          onLoad();
          return;
        }
        defaultNote.content.data = undefined;
        setNote({ ...defaultNote });
        const data = await ShareExtension.data();

        if (!data || data.length === 0) {
          setRawData({
            value: "",
            type: "text"
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
              noteTitle.current = note.title;
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
              }
              if (key.includes("TEXT") && !note.content.data) {
                note.content.data = item[key];
                noteContent.current = item[key];
              }
            }
          } else {
            const user = await db.user.getUser();
            if (user) {
              const feature = await isFeatureAvailable(
                "fileSize",
                item.size || 0
              );
              if (!feature.isAllowed) {
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

        inputRef.current?.setNativeProps?.({
          text: noteTitle.current
        });
        onLoad();
        setNote({ ...note });
      } catch (e) {
        console.error(e);
      }
    },
    [onLoad]
  );

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        setLoadingExtension(false);
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
      const note = await db.notes.note(appendNoteId);
      if (!note) {
        useShareStore.getState().setAppendNote(null);
        Alert.alert("The note you are trying to append to has been deleted.");
        setLoading(false);
        return;
      }

      let rawContent = note.contentId
        ? await db.content.get(note.contentId)
        : null;
      noteData = {
        content: {
          data: (rawContent?.data || "") + "<br/>" + noteContent.current,
          type: "tiptap"
        },
        id: note?.id,
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

  const changeMode = async (value: number) => {
    setMode(value);

    setLoading(true);
    try {
      if (value === 2) {
        setLoadingPage(true);
        setTimeout(async () => {
          let html = await sanitizeHtml(rawData?.value || "");
          noteContent.current = html || "";
          setLoadingPage(false);
          onLoad();
          setNote((note) => {
            note.content.data = html || "";
            return { ...note };
          });
        }, 300);
      } else {
        setLoadingPage(false);
        let html = !rawData.value
          ? ""
          : isURL(rawData?.value)
            ? makeHtmlFromUrl(rawData?.value)
            : makeHtmlFromPlainText(rawData?.value);
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

  const onRemoveFile = (item: ShareItem) => {
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
    <View
      style={{
        width: width > 500 ? 500 : width,
        height: "100%",
        alignSelf: "center",
        justifyContent: "flex-end",
        overflow: "hidden",
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom:
          Platform.OS === "android" && keyboardHeight
            ? keyboardHeight - (insets.bottom || (gesturesEnabled ? 25 : 50))
            : 0
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
          getKeyboardHeight={() => keyboardHeightRef.current}
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
                        fontFamily: "Inter-SemiBold",
                        fontSize: AppFontSize.lg,
                        paddingBottom: 0,
                        paddingTop: 0
                      }}
                      allowFontScaling={false}
                    >
                      Save note
                    </Heading>
                  ) : (
                    <TextInput
                      placeholder="Enter note title"
                      ref={inputRef}
                      allowFontScaling={false}
                      style={{
                        flexShrink: 1,
                        flexGrow: 1,
                        fontFamily: "Inter-SemiBold",
                        fontSize: AppFontSize.lg,
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
                        editorRef.current?.focus();
                      }}
                    />
                  )}
                  <Button
                    title="Done"
                    type="accent"
                    loading={loading}
                    onPress={onPress}
                    allowFontScaling={false}
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
                      allowFontScaling={false}
                    >
                      Attaching {rawFiles.length} file(s):
                    </Paragraph>
                    <ScrollView horizontal>
                      {rawFiles.map((item) =>
                        isImage(item.type) || item.value?.endsWith(".png") ? (
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
                                borderRadius: defaultBorderRadius,
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
                            onPress={() => onRemoveFile(item)}
                            style={{
                              borderRadius: defaultBorderRadius,
                              backgroundColor: colors.secondary.background,
                              flexDirection: "row",
                              borderWidth: 1,
                              borderColor: colors.primary.border,
                              alignItems: "center",
                              paddingVertical: 5,
                              paddingHorizontal: 8,
                              marginRight: 6
                            }}
                          >
                            <Icon
                              color={colors.primary.icon}
                              size={15}
                              name="file"
                            />

                            <Paragraph
                              size={AppFontSize.xs}
                              color={colors.primary.paragraph}
                              allowFontScaling={false}
                              style={{
                                marginLeft: 4,
                                paddingRight: 8
                              }}
                            >
                              {item.name || item.value.split("/").pop()}
                              {item.size ? `(${formatBytes(item.size)})` : ""}
                            </Paragraph>
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>

                    <Paragraph
                      color={colors.secondary.paragraph}
                      size={AppFontSize.xs}
                      allowFontScaling={false}
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
                          if (fullQualityImages?.isAllowed) {
                            setCompress(!compress);
                          }
                        }}
                      >
                        <Icon
                          size={20}
                          name={
                            compress
                              ? "checkbox-marked"
                              : "checkbox-blank-outline"
                          }
                          allowFontScaling={false}
                          color={
                            compress && fullQualityImages?.isAllowed
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
                          allowFontScaling={false}
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
                    allowFontScaling={false}
                  >
                    Clip Mode:
                  </Paragraph>
                  {rawData.value && isURL(rawData.value) ? (
                    <Button
                      type={mode === 2 ? "inverted" : "plain"}
                      icon={mode === 2 ? "radiobox-marked" : "radiobox-blank"}
                      onPress={() => changeMode(2)}
                      title={modes[2].title}
                      height={30}
                      allowFontScaling={false}
                      style={{
                        paddingHorizontal: 6
                      }}
                    />
                  ) : null}
                  <Button
                    type={mode === 1 ? "inverted" : "plain"}
                    icon={mode === 1 ? "radiobox-marked" : "radiobox-blank"}
                    onPress={() => changeMode(1)}
                    allowFontScaling={false}
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
                allowFontScaling={false}
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
                allowFontScaling={false}
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
                height: isTablet() ? 150 : Platform.OS === "ios" ? 110 : 0
              }}
            />
          </View>
        </ScrollView>
      </WrapperView>
    </View>
  );
};

const AppendNote = ({
  id,
  onLoad
}: {
  id: string;
  onLoad: (title: string) => void;
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(id, "note");

  useEffect(() => {
    if (item?.title) {
      onLoad?.(item.title);
    }
  }, [item?.title, onLoad]);

  return !item ? null : (
    <Paragraph
      size={AppFontSize.xs}
      color={colors.secondary.paragraph}
      allowFontScaling={false}
      style={{
        paddingHorizontal: 12,
        marginBottom: 10,
        flexWrap: "wrap"
      }}
    >
      Above content will append to{" "}
      <Paragraph
        size={AppFontSize.xs}
        style={{
          color: colors.primary.accent,
          fontWeight: "bold"
        }}
        allowFontScaling={false}
      >
        {`"${item.title}"`}
      </Paragraph>{" "}
      . Click on {'"New note"'} to create a new note.
    </Paragraph>
  );
};

export default ShareView;
