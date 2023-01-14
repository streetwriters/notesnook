/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { getPreviewData } from "@flyerhq/react-native-link-preview";
import { parseHTML } from "@notesnook/core/utils/html-parser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ShareExtension from "rn-extensions-share";
import isURL from "validator/lib/isURL";
import { db } from "../app/common/database";
import Storage from "../app/common/database/storage";
import { eSendEvent } from "../app/services/event-manager";
import { getElevation } from "../app/utils";
import { eOnLoadNote } from "../app/utils/events";
import { sleep } from "../app/utils/time";
import { Search } from "./search";
import { useShareStore } from "./store";
import { Editor } from "./editor";
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
  return `<a style="overflow-wrap:anywhere;white-space:pre-wrap" href='${url}' target='_blank'>${url}</a>`;
}

function makeHtmlFromPlainText(text) {
  if (!text) return "";

  return `<p style="overflow-wrap:anywhere;white-space:pre-wrap" >${text.replace(
    /(?:\r\n|\r|\n)/g,
    "<br>"
  )}</p>`;
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
  const colors = useShareStore((state) => state.colors);
  const accent = useShareStore((state) => state.accent);
  const appendNote = useShareStore((state) => state.appendNote);
  const [note, setNote] = useState({ ...defaultNote });
  const noteContent = useRef();
  const [loadingIntent, setLoadingIntent] = useState(true);
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
  const [showSearch, setShowSearch] = useState(false);
  const [kh, setKh] = useState(0);
  const editorRef = useRef();

  const onKeyboardDidShow = (event) => {
    let kHeight = event.endCoordinates.height;
    keyboardHeight.current = kHeight;
    setKh(kHeight);
  };

  const onKeyboardDidHide = () => {
    keyboardHeight.current = 0;
    setKh(0);
  };

  useEffect(() => {
    useShareStore.getState().setAccent();
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
        setLoadingIntent(false);
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
        }
      }
      setNote({ ...note });
      onLoad();
    } catch (e) {
      console.error(e);
    }
    setLoadingIntent(false);
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
      //await loadDatabase();
      setLoadingExtension(false);
      loadData();
      useShareStore.getState().restoreAppendNote();
    })();
  }, [loadData]);

  const close = async () => {
    setNote({ ...defaultNote });
    setLoadingIntent(true);
    setLoadingExtension(true);
    if (quicknote) {
      ShareExtension.openURL("ShareMedia://MainApp");
    } else {
      ShareExtension.close();
    }
  };

  const onPress = async () => {
    setLoading(true);
    await db.init();
    await db.notes.init();
    await sleep(1500);
    if (!noteContent.current) return;
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
          data: raw.data + "\n" + noteContent.current,
          type: "tiptap"
        },
        id: appendNote.id,
        sessionId: Date.now()
      };
    } else {
      _note = { ...note };
      _note.content.data = noteContent.current;
      _note.sessionId = Date.now();
    }
    await db.notes.add(_note);
    await Storage.write("notesAddedFromIntent", "added");
    close();
    setLoading(false);
  };

  useEffect(() => {
    useShareStore.getState().setColors();
  }, [note]);

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

  return loadingExtension ? null : (
    <SafeAreaView
      style={{
        width: width > 500 ? 500 : width,
        height: quicknote ? height : height - kh,
        alignSelf: "center",
        justifyContent: quicknote ? "flex-start" : "flex-end"
      }}
    >
      {quicknote && !showSearch ? (
        <View
          style={{
            width: "100%",
            backgroundColor: colors.bg,
            height: 50 + insets.top,
            paddingTop: insets.top,
            ...getElevation(1),
            marginTop: -insets.top,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Button
            type="action"
            icon="close"
            iconColor={colors.pri}
            onPress={() => {
              if (showSearch) {
                setShowSearch(false);
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
              color: colors.pri,
              fontSize: 17,
              fontFamily: "OpenSans-Regular"
            }}
          >
            Quick note
          </Text>

          <Button
            type="action"
            icon="check"
            iconColor={accent.color}
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
            if (showSearch) {
              setShowSearch(false);
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

      {showSearch ? (
        <Search
          quicknote={quicknote}
          getKeyboardHeight={() => keyboardHeight.current}
          close={() => {
            setShowSearch(false);
          }}
        />
      ) : null}

      <View
        style={{
          paddingVertical: 25,
          backgroundColor: "transparent",
          marginBottom: insets.top,
          display: showSearch ? "none" : "flex"
        }}
      >
        <View
          style={{
            maxHeight: "100%",
            paddingHorizontal: 12
          }}
        >
          <View
            style={{
              width: "100%"
            }}
          >
            <View
              style={{
                marginTop: 10,
                minHeight: 100,
                borderRadius: 10,
                ...getElevation(quicknote ? 1 : 5),
                backgroundColor: colors.bg,
                overflow: "hidden"
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: height * 0.3,
                  paddingBottom: 15,
                  borderRadius: 10
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
                    color: colors.icon,
                    fontFamily: "OpenSans-Regular",
                    paddingHorizontal: 12,
                    marginBottom: 10,
                    flexWrap: "wrap"
                  }}
                >
                  Above content will append to{" "}
                  <Text
                    style={{
                      color: accent.color,
                      fontFamily: "OpenSans-SemiBold"
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
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  width: "100%"
                }}
              >
                <View
                  style={{
                    flexDirection: "row"
                  }}
                >
                  {rawData.value && isURL(rawData.value) ? (
                    <Button
                      color={mode == 2 ? colors.shade : colors.nav}
                      icon={modes[2].icon}
                      onPress={() => changeMode(2)}
                      title={modes[2].title}
                      iconSize={18}
                      iconColor={mode == 2 ? accent.color : colors.icon}
                      textColor={mode == 2 ? accent.color : colors.icon}
                      type="rounded"
                      style={{ paddingHorizontal: 12 }}
                    />
                  ) : null}
                  <Button
                    color={mode == 1 ? colors.shade : colors.nav}
                    icon={modes[1].icon}
                    onPress={() => changeMode(1)}
                    title={modes[1].title}
                    iconSize={18}
                    iconColor={mode == 1 ? accent.color : colors.icon}
                    textColor={mode == 1 ? accent.color : colors.icon}
                    type="rounded"
                    style={{ paddingHorizontal: 12 }}
                  />
                </View>

                {!quicknote ? (
                  <Button
                    color={accent.color}
                    onPress={onPress}
                    loading={loading || loadingIntent}
                    icon="check"
                    iconSize={20}
                    iconColor={colors.light}
                    style={{
                      paddingHorizontal: 0,
                      height: 40,
                      width: 40,
                      borderRadius: 100,
                      minWidth: 0
                    }}
                  />
                ) : null}
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
          }}
        >
          <Button
            color={colors.bg}
            onPress={() => {
              useShareStore.getState().setAppendNote(null);
            }}
            icon="plus"
            iconSize={18}
            iconColor={!appendNote ? accent.color : colors.icon}
            title="New note"
            textColor={!appendNote ? accent.color : colors.icon}
            type="button"
            textStyle={{
              fontSize: 15
            }}
            style={{
              paddingHorizontal: 0,
              ...getElevation(1),
              height: 45,
              width: "100%",
              marginRight: 0
            }}
          />

          <Button
            color={colors.bg}
            onPress={() => {
              setShowSearch(true);
            }}
            icon="text-short"
            iconSize={18}
            iconColor={appendNote ? accent.color : colors.icon}
            title={`${
              appendNote ? appendNote.title.slice(0, 25) : "Append to note"
            }`}
            textColor={appendNote ? accent.color : colors.icon}
            type="button"
            textStyle={{
              fontSize: 15
            }}
            style={{
              paddingHorizontal: 0,
              ...getElevation(1),
              height: 45,
              width: "100%",
              marginRight: 0
            }}
          />
        </View>

          <View
            style={{
              height: Platform.isPad ? 150 : Platform.OS === "ios" ? 110 : 0
            }}
          />
        </View>
      
      </View>
    </SafeAreaView>
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
        minWidth: 80,
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
          minWidth: 80,
          paddingHorizontal: 20
        },
        types[type].style,
        style
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
              fontFamily: "OpenSans-Regular",
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
