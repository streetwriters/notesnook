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

import {
  Attachment,
  FilteredSelector,
  Note,
  SortOptions,
  VirtualizedGrouping
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { ScrollView } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import create, { State } from "zustand";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import { downloadAttachments } from "../../common/filesystem/download-attachment";
import { AttachmentGroupProgress } from "../../screens/settings/attachment-group-progress";
import { presentSheet, ToastManager } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { AppFontSize } from "../../utils/size";
import { Dialog } from "../dialog";
import { presentDialog } from "../dialog/functions";
import { Header } from "../header";
import SheetProvider from "../sheet-provider";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AttachmentItem } from "./attachment-item";

const DEFAULT_SORTING: SortOptions = {
  sortBy: "dateEdited",
  sortDirection: "desc"
};

type RecheckerProgress = {
  failed: number;
  passed: number;
  isWorking: boolean;
  shown: boolean;
  filter: string;
};

interface RecheckerState extends State {
  progress: {
    [key: string]: RecheckerProgress;
  };
  setProgress: (key: string, progress: RecheckerProgress) => void;
  currentFilter: string;
}

const useRechecker = create<RecheckerState>((set) => ({
  progress: {
    all: {
      failed: 0,
      passed: 0,
      isWorking: false,
      shown: false,
      filter: "all"
    }
  },
  currentFilter: "all",
  setProgress: (key: string, progress: RecheckerProgress) => {
    set((state) => ({
      progress: {
        ...state.progress,
        [key]: progress
      }
    }));
  }
}));

const attachmentTypes = [
  {
    title: strings.mediaTypes.all(),
    filterBy: "all"
  },
  {
    title: strings.mediaTypes.image(),
    filterBy: "images"
  },
  {
    title: strings.mediaTypes.audio(),
    filterBy: "audio"
  },
  {
    title: strings.mediaTypes.video(),
    filterBy: "video"
  },
  {
    title: strings.mediaTypes.document(),
    filterBy: "documents"
  },
  {
    title: strings.mediaTypes.orphaned(),
    filterBy: "orphaned"
  },
  {
    title: strings.mediaTypes.errors(),
    filterBy: "errors"
  }
];

export const AttachmentDialog = ({
  note,
  isSheet
}: {
  note?: Note;
  isSheet: boolean;
}) => {
  const { colors } = useThemeColors();
  const [attachments, setAttachments] =
    useState<VirtualizedGrouping<Attachment>>();
  const attachmentSearchValue = useRef<string>();
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<NodeJS.Timeout>();
  const [currentFilter, setCurrentFilter] = useState("all");
  const rechecker = useRechecker((state) =>
    note ? state.progress[note.id] || {} : state.progress.all
  );
  const currentFilterRef = useRef(currentFilter);
  currentFilterRef.current = currentFilter;

  useEffect(() => {
    useRechecker.setState({
      currentFilter: currentFilter
    });
  }, [currentFilter]);

  const refresh = React.useCallback(() => {
    if (note) {
      db.attachments
        .ofNote(note.id, "all")
        .sorted({
          ...DEFAULT_SORTING,
          sortBy: "dateModified"
        })
        .then((attachments) => {
          setLoading(false);
          setAttachments(attachments);
        });
    } else {
      db.attachments.all
        .sorted({
          ...DEFAULT_SORTING,
          sortBy: "dateModified"
        })
        .then((attachments) => {
          setAttachments(attachments);
          setLoading(false);
        });
    }
  }, [note]);

  useEffect(() => {
    refresh();
  }, [note, refresh]);

  const onChangeText = async (text: string) => {
    attachmentSearchValue.current = text;
    if (
      !attachmentSearchValue.current ||
      attachmentSearchValue.current === ""
    ) {
      setAttachments(await filterAttachments(currentFilter));
      refresh();
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const results = await db.lookup
        .attachments(attachmentSearchValue.current as string)
        .sorted();
      if (results.length === 0) return;
      setAttachments(results);
    }, 300);
  };

  const renderItem = ({ index }: { item: boolean; index: number }) => (
    <AttachmentItem
      setAttachments={async () => {
        setAttachments(await filterAttachments(currentFilter));
      }}
      errorOnly={currentFilter === "errors"}
      attachments={attachments}
      id={index}
      context={!isSheet ? "global" : "attachments-list"}
    />
  );

  const onCheck = async () => {
    const getState = () =>
      useRechecker.getState().progress[note?.id || "all"] || {};
    const setState = (state: Partial<RecheckerProgress>) =>
      useRechecker.getState().setProgress(note?.id || "all", {
        ...getState(),
        ...state
      });

    if (!attachments || getState().isWorking) return;
    setState({
      isWorking: true,
      failed: 0,
      passed: 0,
      shown: true,
      filter: currentFilterRef.current
    });
    const filter = currentFilterRef.current;
    const filteredAttachments = await filterAttachments(
      currentFilterRef.current
    );

    for (let i = 0; i < filteredAttachments.placeholders.length; i++) {
      if (!getState().isWorking) {
        ToastManager.show({
          message: strings.attachmentRecheckCancelled(),
          type: "info",
          context: isSheet ? "local" : "global"
        });
        return;
      }
      const attachment = (await attachments.item(i))?.item;
      if (currentFilter == "errors" && !attachment?.failed) continue;

      if (!attachment) continue;
      const result = await filesystem.checkAttachment(attachment.hash);
      if (!result) return;
      if (result.failed) {
        setState({
          failed: getState().failed + 1
        });
        await db.attachments.markAsFailed(attachment.hash, result.failed);
      } else {
        setState({
          passed: getState().passed + 1
        });
        await db.attachments.markAsFailed(attachment.id);
      }
    }
    if (filter === useRechecker.getState().currentFilter) {
      setAttachments(await filterAttachments(currentFilter));
    }

    setState({
      isWorking: false
    });
  };

  const filterAttachments = async (type: string) => {
    let items: FilteredSelector<Attachment> = db.attachments.all;

    switch (type) {
      case "all":
        items = note
          ? db.attachments.ofNote(note.id, "all")
          : db.attachments.all;
        break;
      case "images":
        items = note
          ? db.attachments.ofNote(note.id, "images")
          : db.attachments.images;
        break;
      case "video":
        items = items = note
          ? db.attachments.ofNote(note.id, "videos")
          : db.attachments.videos;
        break;
      case "audio":
        items = note
          ? db.attachments.ofNote(note.id, "audio")
          : db.attachments.audios;
        break;
      case "documents":
        items = note
          ? db.attachments.ofNote(note.id, "documents")
          : db.attachments.documents;
        break;
      case "orphaned":
        items = db.attachments.orphaned;
        break;
      case "errors":
        items = items = note
          ? db.attachments.ofNote(note.id, "all")
          : db.attachments.all;
    }

    return await items.sorted({
      ...DEFAULT_SORTING,
      sortBy: "dateModified"
    });
  };

  return (
    <>
      {isSheet ? (
        <>
          <SheetProvider context="attachments-list" />
          <Dialog context="local" />
        </>
      ) : null}
      {!isSheet ? (
        <Header
          title={strings.manageAttachments()}
          renderedInRoute="SettingsGroup"
          canGoBack
          // TODO: Add headerRightButtons
          // headerRightButtons={[
          //   {
          //     onPress() {
          //       onCheck();
          //     },
          //     title: strings.recheckAll()
          //   },
          //   {
          //     onPress() {
          //       if (!attachments) return;
          //       presentDialog({
          //         title: strings.doActions.download.attachment(
          //           attachments.placeholders.length
          //         ),
          //         positiveText: strings.network.download(),
          //         positivePress: async () => {
          //           downloadAttachments(await attachments.ids());
          //         },
          //         negativeText: strings.cancel()
          //       });
          //     },
          //     title: strings.downloadAllAttachments()
          //   }
          // ]}
        />
      ) : (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 12
          }}
        >
          <Heading>{strings.dataTypesPluralCamelCase.attachment()}</Heading>

          <View
            style={{
              flexDirection: "row"
            }}
          >
            <IconButton
              name="check-all"
              style={{
                height: 40,
                width: 40,
                marginRight: 10
              }}
              color={colors.primary.paragraph}
              size={AppFontSize.lg}
              onPress={onCheck}
            />

            <IconButton
              name="download"
              style={{
                height: 40,
                width: 40
              }}
              color={colors.primary.paragraph}
              onPress={() => {
                if (!attachments) return;
                presentDialog({
                  title: strings.doActions.download.attachment(
                    attachments.placeholders.length
                  ),
                  positiveText: strings.network.download(),
                  positivePress: async () => {
                    downloadAttachments(await attachments.ids());
                  },
                  negativeText: strings.cancel()
                });
              }}
              size={AppFontSize.lg}
            />
          </View>
        </View>
      )}

      <View
        style={{
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: 12,
          height: "100%"
        }}
      >
        <Seperator />
        <Input
          placeholder={strings.filterAttachments()}
          onChangeText={onChangeText}
          onSubmit={() => {
            onChangeText(attachmentSearchValue.current as string);
          }}
        />

        {rechecker.shown ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.primary.border,
              gap: 12,
              justifyContent: "space-between"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center"
              }}
            >
              {rechecker.isWorking ? (
                <ActivityIndicator color={colors.primary.accent} />
              ) : (
                <Icon
                  name="file-check"
                  size={30}
                  color={colors.primary.accent}
                />
              )}

              <View>
                <Paragraph>
                  {rechecker.isWorking
                    ? note
                      ? strings.checkingNoteAttachments()
                      : strings.checkingAllAttachments()
                    : strings.attachmentRecheckComplete()}
                </Paragraph>
                <Paragraph>
                  {`${
                    rechecker.isWorking ? `${strings.pleaseWait()} ` : ""
                  }${strings.passed()}: ${
                    rechecker.passed
                  }, ${strings.failed()}: ${rechecker.failed}`}
                </Paragraph>
              </View>
            </View>

            <IconButton
              type={rechecker.isWorking ? "errorShade" : "plain"}
              name={rechecker.isWorking ? "close" : "check"}
              size={AppFontSize.lg}
              color={
                rechecker.isWorking ? colors.error.icon : colors.primary.accent
              }
              onPress={() => {
                useRechecker.getState().setProgress(note?.id || "all", {
                  ...useRechecker.getState().progress[note?.id || "all"],
                  shown: false,
                  isWorking: false
                });
              }}
            />
          </View>
        ) : null}

        <View>
          <ScrollView
            style={{
              backgroundColor: colors.primary.background,
              flexWrap: "wrap",
              flexDirection: "row",
              paddingVertical: 12
            }}
            contentContainerStyle={{
              alignItems: "center"
            }}
            horizontal
          >
            {attachmentTypes.map((item) =>
              item.filterBy === "orphaned" && note ? null : (
                <Button
                  type={
                    currentFilter === item.filterBy
                      ? "secondaryAccented"
                      : "plain"
                  }
                  key={item.title}
                  title={item.title}
                  fontSize={AppFontSize.sm}
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    height: 40,
                    minWidth: 80
                  }}
                  onPress={async () => {
                    const filterBy = item.filterBy;
                    setCurrentFilter(filterBy);
                    setLoading(true);
                    filterAttachments(filterBy)
                      .then((results) => {
                        if (filterBy !== currentFilterRef.current) return;
                        setAttachments(results);
                        setLoading(false);
                      })
                      .catch(() => {
                        /* empty */
                      });
                  }}
                />
              )
            )}
          </ScrollView>
        </View>

        <FlashList
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          ListEmptyComponent={
            <View
              style={{
                height: "100%",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {loading ? (
                <ActivityIndicator size={40} color={colors.primary.accent} />
              ) : (
                <>
                  <Icon
                    name="attachment"
                    size={60}
                    color={colors.secondary.icon}
                  />
                  <Paragraph>{strings.noAttachments()}</Paragraph>
                </>
              )}
            </View>
          }
          ListHeaderComponent={<AllProgress note={note} />}
          ListFooterComponent={
            <View
              style={{
                height: 350
              }}
            />
          }
          estimatedItemSize={50}
          data={loading ? [] : attachments?.placeholders}
          renderItem={renderItem}
        />
      </View>
    </>
  );
};

const AllProgress = ({ note }: { note?: Note }) => {
  const progress = useAttachmentStore((state) =>
    note
      ? {
          downloading: {
            [note.id]: state.downloading?.[note.id]
          },
          uploading: {
            [note.id]: state.uploading?.[note.id]
          }
        }
      : state
  );

  return (
    <View
      style={{
        gap: 10,
        width: "100%"
      }}
    >
      {Object.keys(progress.downloading || {}).map((groupId) => (
        <AttachmentGroupProgress key={groupId} groupId={groupId} />
      ))}

      {Object.keys(progress.uploading || {}).map((groupId) => (
        <AttachmentGroupProgress key={groupId} groupId={groupId} />
      ))}
    </View>
  );
};

AttachmentDialog.present = (note?: Note) => {
  presentSheet({
    component: () => <AttachmentDialog note={note} isSheet={true} />,
    keyboardHandlerDisabled: true
  });
};
