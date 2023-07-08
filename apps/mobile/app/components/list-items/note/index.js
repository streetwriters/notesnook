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

import { getUpcomingReminder } from "@notesnook/core/collections/reminders";
import { decode, EntityLevel } from "entities";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import Notebook from "../../../screens/notebook";
import { TaggedNotes } from "../../../screens/notes/tagged";
import { TopicNotes } from "../../../screens/notes/topic-notes";
import useNavigationStore from "../../../stores/use-navigation-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { COLORS_NOTE } from "../../../utils/color-scheme";
import { SIZE } from "../../../utils/size";
import { Properties } from "../../properties";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { ReminderTime } from "../../ui/reminder-time";
import { TimeSince } from "../../ui/time-since";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

function navigateToTag(item) {
  const tag = db.tags.tag(item.id);
  if (!tag) return;
  TaggedNotes.navigate(tag, true);
}

const showActionSheet = (item) => {
  Properties.present(item);
};

function getNotebook(item) {
  const isTrash = item.type === "trash";
  const currentId = useNavigationStore.getState().currentScreen.id;
  if (isTrash) return [];
  const items = [];
  const notebooks = db.relations.to(item, "notebook") || [];

  for (let notebook of notebooks) {
    if (items.length > 1) break;
    if (notebook.id === currentId) continue;
    items.push(notebook);
  }

  if (item.notebooks) {
    for (let nb of item.notebooks) {
      if (items.length > 1) break;
      const notebook = db.notebooks?.notebook(nb.id)?.data;
      if (!notebook) continue;
      for (let topicId of nb.topics) {
        if (items.length > 1) break;
        if (topicId === currentId) continue;
        const topic = notebook.topics.find((t) => t.id === topicId);
        if (!topic) continue;
        items.push(topic);
      }
    }
  }
  return items;
}

function getTags(item) {
  const noteTags = item.tags?.slice(0, 3) || [];
  const tags = [];
  for (const tagName of noteTags) {
    const tag = db.tags.tag(tagName);
    if (!tag) continue;
    tags.push(tag);
  }
  return tags;
}

const NoteItem = ({
  item,
  isTrash,
  dateBy = "dateCreated",
  noOpen = false
}) => {
  const { colors } = useThemeColors();
  const notesListMode = useSettingStore(
    (state) => state.settings.notesListMode
  );
  const compactMode = notesListMode === "compact";
  const attachmentCount = db.attachments?.ofNote(item.id, "all")?.length || 0;
  const _update = useRelationStore((state) => state.updater);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notebooks = React.useMemo(() => getNotebook(item), [item, _update]);
  const reminders = db.relations.from(item, "reminder");
  const reminder = getUpcomingReminder(reminders);
  const noteColor = COLORS_NOTE[item.color?.toLowerCase()];
  const tags = getTags(item);
  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}
      >
        {!compactMode ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              zIndex: 10,
              elevation: 10,
              marginBottom: 2.5,
              flexWrap: "wrap"
            }}
          >
            {notebooks?.map((item) => (
              <Button
                title={
                  item.title.length > 25
                    ? item.title.slice(0, 25) + "..."
                    : item.title
                }
                tooltipText={item.title}
                key={item.id}
                height={25}
                icon={item.type === "topic" ? "bookmark" : "book-outline"}
                type="grayBg"
                fontSize={SIZE.xs}
                iconSize={SIZE.sm}
                textStyle={{
                  marginRight: 0
                }}
                style={{
                  borderRadius: 5,
                  marginRight: 5,
                  borderWidth: 0.5,
                  borderColor: colors.primary.border,
                  paddingHorizontal: 6,
                  marginBottom: 5
                }}
                onPress={() => {
                  if (item.type === "topic") {
                    TopicNotes.navigate(item, true);
                  } else {
                    Notebook.navigate(item);
                  }
                }}
              />
            ))}

            <ReminderTime
              reminder={reminder}
              color={noteColor}
              onPress={() => {
                Properties.present(reminder);
              }}
              style={{
                height: 25
              }}
            />
          </View>
        ) : null}

        {compactMode ? (
          <Paragraph
            numberOfLines={1}
            color={
              COLORS_NOTE[item.color?.toLowerCase()] || colors.primary.heading
            }
            style={{
              flexWrap: "wrap"
            }}
            size={SIZE.sm}
          >
            {item.title}
          </Paragraph>
        ) : (
          <Heading
            numberOfLines={1}
            color={
              COLORS_NOTE[item.color?.toLowerCase()] || colors.primary.heading
            }
            style={{
              flexWrap: "wrap"
            }}
            size={SIZE.md}
          >
            {item.title}
          </Heading>
        )}

        {item.headline && !compactMode ? (
          <Paragraph
            style={{
              flexWrap: "wrap"
            }}
            numberOfLines={2}
          >
            {decode(item.headline, {
              level: EntityLevel.HTML
            })}
          </Paragraph>
        ) : null}

        {compactMode ? null : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
              marginTop: 5,
              height: SIZE.md + 2
            }}
          >
            {!isTrash ? (
              <>
                {item.conflicted ? (
                  <Icon
                    name="alert-circle"
                    style={{
                      marginRight: 6
                    }}
                    size={SIZE.sm}
                    color={colors.error.accent}
                  />
                ) : null}
                <TimeSince
                  style={{
                    fontSize: SIZE.xs,
                    color: colors.secondary.paragraph,
                    marginRight: 6
                  }}
                  time={item[dateBy]}
                  updateFrequency={
                    Date.now() - item[dateBy] < 60000 ? 2000 : 60000
                  }
                />

                {attachmentCount > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 6
                    }}
                  >
                    <Icon
                      name="attachment"
                      size={SIZE.md}
                      color={colors.primary.icon}
                    />
                    <Paragraph
                      color={colors.secondary.paragraph}
                      size={SIZE.xs}
                    >
                      {attachmentCount}
                    </Paragraph>
                  </View>
                ) : null}

                {item.pinned ? (
                  <Icon
                    testID="icon-pinned"
                    name="pin-outline"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color={
                      COLORS_NOTE[item.color?.toLowerCase()] ||
                      colors.primary.accent
                    }
                  />
                ) : null}

                {item.locked ? (
                  <Icon
                    name="lock"
                    testID="note-locked-icon"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color={colors.primary.icon}
                  />
                ) : null}

                {item.favorite ? (
                  <Icon
                    testID="icon-star"
                    name="star-outline"
                    size={SIZE.md}
                    style={{
                      marginRight: 6
                    }}
                    color="orange"
                  />
                ) : null}

                {!isTrash && !compactMode && tags
                  ? tags.map((item) =>
                      item.id ? (
                        <Button
                          title={"#" + item.alias}
                          key={item.id}
                          height={23}
                          type="gray"
                          textStyle={{
                            textDecorationLine: "underline"
                          }}
                          hitSlop={{ top: 8, bottom: 12, left: 0, right: 0 }}
                          fontSize={SIZE.xs}
                          style={{
                            borderRadius: 5,
                            paddingHorizontal: 6,
                            marginRight: 4,
                            zIndex: 10,
                            maxWidth: tags.length > 1 ? 130 : null
                          }}
                          onPress={() => navigateToTag(item)}
                        />
                      ) : null
                    )
                  : null}
              </>
            ) : (
              <>
                <Paragraph
                  color={colors.secondary.background}
                  size={SIZE.xs}
                  style={{
                    marginRight: 6
                  }}
                >
                  Deleted on{" "}
                  {item && item.dateDeleted
                    ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                    : null}
                </Paragraph>

                <Paragraph
                  color={colors.primary.accent}
                  size={SIZE.xs}
                  style={{
                    marginRight: 6
                  }}
                >
                  {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
                </Paragraph>
              </>
            )}
          </View>
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {compactMode ? (
          <>
            {item.conflicted ? (
              <Icon
                name="alert-circle"
                style={{
                  marginRight: 6
                }}
                size={SIZE.sm}
                color={colors.error.accent}
              />
            ) : null}

            {item.locked ? (
              <Icon
                name="lock"
                testID="note-locked-icon"
                size={SIZE.sm}
                style={{
                  marginRight: 6
                }}
                color={colors.secondary.background}
              />
            ) : null}

            {item.favorite ? (
              <Icon
                testID="icon-star"
                name="star-outline"
                size={SIZE.md}
                style={{
                  marginRight: 6
                }}
                color="orange"
              />
            ) : null}

            <TimeSince
              style={{
                fontSize: SIZE.xs,
                color: colors.secondary.paragraph,
                marginRight: 6
              }}
              time={item[dateBy]}
              updateFrequency={Date.now() - item[dateBy] < 60000 ? 2000 : 60000}
            />
          </>
        ) : null}

        <IconButton
          testID={notesnook.listitem.menu}
          color={colors.primary.paragraph}
          name="dots-horizontal"
          size={SIZE.xl}
          onPress={() => !noOpen && showActionSheet(item, isTrash)}
          customStyle={{
            justifyContent: "center",
            height: 35,
            width: 35,
            borderRadius: 100,
            alignItems: "center"
          }}
        />
      </View>
    </>
  );
};

export default NoteItem;
