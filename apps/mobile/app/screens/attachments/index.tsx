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
import { ActivityIndicator, FlatList, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import create from "zustand";
import { db } from "../../common/database";
import { FontSizes } from "../../common/design/font";
import { Radius, Spacing } from "../../common/design/spacing";
import filesystem from "../../common/filesystem";
import { downloadAttachments } from "../../common/filesystem/download-attachment";
import { AttachmentItem } from "../../components/attachments/attachment-item";
import { presentDialog } from "../../components/dialog/functions";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import LineSeparator from "../../components/ui/seperator/line-separator";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import { NavigationProps } from "../../services/navigation";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { AttachmentGroupProgress } from "../settings/components/attachment-group-progress";

const DEFAULT_SORTING: SortOptions = {
  sortBy: "dateModified",
  sortDirection: "desc"
};

type RecheckerProgress = {
  failed: number;
  passed: number;
  isWorking: boolean;
  shown: boolean;
  filter: string;
};

interface RecheckerState {
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

const Attachments = (props: NavigationProps<"Attachments">) => {
  const note = props.route.params?.note;
  const { colors } = useThemeColors();
  const [attachments, setAttachments] =
    useState<VirtualizedGrouping<Attachment>>();
  const attachmentSearchValue = useRef<string>(undefined);
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<NodeJS.Timeout>(undefined);
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
        .sorted(DEFAULT_SORTING)
        .then((attachments) => {
          setLoading(false);
          setAttachments(attachments);
        });
    } else {
      db.attachments.all.sorted(DEFAULT_SORTING).then((attachments) => {
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

  const renderItem = ({ index }: { item: boolean | number; index: number }) => (
    <AttachmentItem
      setAttachments={async () => {
        setAttachments(await filterAttachments(currentFilter));
      }}
      errorOnly={currentFilter === "errors"}
      attachments={attachments}
      id={index}
      context="global"
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
          context: "global"
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
        items = note
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
        items = note
          ? db.attachments.ofNote(note.id, "all")
          : db.attachments.all;
    }

    return await items.sorted(DEFAULT_SORTING);
  };

  const downloadAll = () => {
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
  };

  const currentType = attachmentTypes.find(
    (item) => item.filterBy === currentFilter
  );
  const sectionTitle =
    currentFilter === "all"
      ? strings.allAttachments()
      : currentType?.title || strings.allAttachments();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary.background }}
    >
      <Header
        renderedInRoute="Attachments"
        id="Attachments"
        title={strings.dataTypesPluralCamelCase.attachment()}
        canGoBack
        style={{
          backgroundColor: colors.primary.background
        }}
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_3
        }}
      >
        <Input
          placeholder={strings.filterAttachments()}
          onChangeText={onChangeText}
          containerStyle={{
            borderWidth: 0,
            backgroundColor: colors.secondary.background
          }}
          onSubmit={() => {
            onChangeText(attachmentSearchValue.current as string);
          }}
          button={{
            icon: "search",
            iconFamily: "notesnook",
            color: colors.primary.icon,
            size: 16,
            onPress: () => {}
          }}
        />

        <LineSeparator />

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: Spacing.LEVEL_1
            }}
          >
            {attachmentTypes.map((item) =>
              item.filterBy === "orphaned" && note ? null : (
                <Pressable
                  key={item.filterBy}
                  type={
                    currentFilter === item.filterBy ? "selected" : "transparent"
                  }
                  onPress={() => {
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
                  style={{
                    borderRadius: Radius.XXL,
                    borderWidth: currentFilter === item.filterBy ? 0 : 1,
                    borderColor: colors.primary.border,
                    paddingHorizontal: Spacing.LEVEL_3,
                    paddingVertical: Spacing.LEVEL_1,
                    width: "auto"
                  }}
                >
                  <Paragraph
                    fontFamily="MEDIUM"
                    fontSize="SM"
                    color={
                      currentFilter === item.filterBy
                        ? colors.primary.heading
                        : colors.secondary.paragraph
                    }
                  >
                    {item.title}
                  </Paragraph>
                </Pressable>
              )
            )}
          </ScrollView>
        </View>

        {rechecker.shown ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              borderRadius: Radius.S,
              padding: Spacing.LEVEL_2,
              gap: Spacing.LEVEL_2,
              justifyContent: "space-between",
              backgroundColor: colors.primary.shade
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.LEVEL_2,
                alignItems: "center",
                flexShrink: 1
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: colors.secondary.background,
                  borderRadius: Radius.XS,
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <AppIcon
                  name="check-circle"
                  iconFamily="notesnook"
                  size={20}
                  color={colors.primary.icon}
                />
              </View>

              <View style={{ flexShrink: 1, gap: Spacing.LEVEL_0 }}>
                <Heading color={colors.primary.heading} fontSize="SM">
                  {rechecker.isWorking
                    ? note
                      ? strings.checkingNoteAttachments()
                      : strings.checkingAllAttachments()
                    : strings.attachmentRecheckComplete()}
                </Heading>
                <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
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
              name={"close"}
              iconFamily="notesnook"
              size={12}
              color={colors.secondary.icon}
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Heading fontSize="LG">{sectionTitle}</Heading>

          <Button
            title={strings.verifyFiles()}
            icon="shield-check"
            iconFamily="notesnook"
            type="accent"
            fontSize={FontSizes.XS}
            loading={rechecker.isWorking}
            style={{
              paddingVertical: Spacing.LEVEL_2,
              paddingHorizontal: Spacing.LEVEL_2
            }}
            onPress={onCheck}
          />
        </View>

        <FlatList
          style={{ flex: 1 }}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          ListEmptyComponent={
            <View
              style={{
                height: 250,
                justifyContent: "center",
                alignItems: "center",
                gap: Spacing.LEVEL_2
              }}
            >
              {loading ? (
                <ActivityIndicator size={40} color={colors.primary.accent} />
              ) : (
                <>
                  <AppIcon
                    name="paperclip"
                    iconFamily="notesnook"
                    size={50}
                    color={colors.secondary.icon}
                  />
                  <Paragraph color={colors.secondary.paragraph}>
                    {strings.noAttachments()}
                  </Paragraph>
                </>
              )}
            </View>
          }
          ListHeaderComponent={<AllProgress note={note} />}
          ListFooterComponent={<View style={{ height: 350 }} />}
          data={loading ? [] : attachments?.placeholders || []}
          extraData={attachments}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
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
        gap: Spacing.LEVEL_2,
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

export default Attachments;
