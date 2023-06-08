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

import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { TopicNotes } from "../../../screens/notes/topic-notes";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { history } from "../../../utils";
import { SIZE } from "../../../utils/size";
import { Properties } from "../../properties";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { getFormattedDate } from "../../../utils/time";

const showActionSheet = (item) => {
  Properties.present(item);
};

const navigateToTopic = (topic) => {
  if (history.selectedItemsList.length > 0) return;
  TopicNotes.navigate(topic, true);
};

export const NotebookItem = ({
  item,
  isTopic = false,
  isTrash,
  dateBy,
  totalNotes
}) => {
  const colors = useThemeStore((state) => state.colors);
  const notebooksListMode = useSettingStore(
    (state) => state.settings.notebooksListMode
  );
  const compactMode = notebooksListMode === "compact";
  const topics = item.topics?.slice(0, 3) || [];

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}
      >
        {compactMode ? (
          <Paragraph
            size={SIZE.sm}
            numberOfLines={1}
            style={{
              flexWrap: "wrap"
            }}
          >
            {item.title}
          </Paragraph>
        ) : (
          <Heading
            size={SIZE.md}
            numberOfLines={1}
            style={{
              flexWrap: "wrap"
            }}
          >
            {item.title}
          </Heading>
        )}

        {isTopic || !item.description || compactMode ? null : (
          <Paragraph
            size={SIZE.sm}
            numberOfLines={2}
            style={{
              flexWrap: "wrap"
            }}
          >
            {item.description}
          </Paragraph>
        )}

        {isTopic || compactMode ? null : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            {topics.map((topic) => (
              <Button
                title={topic.title}
                key={topic.id}
                height={null}
                textStyle={{
                  fontWeight: "normal",
                  fontFamily: null,
                  marginRight: 0
                }}
                type="grayBg"
                fontSize={SIZE.xs}
                icon="bookmark-outline"
                iconSize={SIZE.sm}
                style={{
                  borderRadius: 5,
                  maxWidth: 120,
                  borderWidth: 0.5,
                  paddingVertical: 2.5,
                  borderColor: colors.icon,
                  paddingHorizontal: 6,
                  marginVertical: 5,
                  marginRight: 5
                }}
                onPress={() => navigateToTopic(topic)}
              />
            ))}
          </View>
        )}

        {!compactMode ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              marginTop: 5,
              height: SIZE.md + 2
            }}
          >
            {isTrash ? (
              <>
                <Paragraph
                  color={colors.icon}
                  size={SIZE.xs}
                  style={{
                    textAlignVertical: "center",
                    marginRight: 6
                  }}
                >
                  {"Deleted on " +
                    new Date(item.dateDeleted).toISOString().slice(0, 10)}
                </Paragraph>
                <Paragraph
                  color={colors.accent}
                  size={SIZE.xs}
                  style={{
                    textAlignVertical: "center",
                    marginRight: 6
                  }}
                >
                  {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
                </Paragraph>
              </>
            ) : (
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 6
                }}
              >
                {getFormattedDate(item[dateBy], "date")}
              </Paragraph>
            )}
            <Paragraph
              color={colors.icon}
              size={SIZE.xs}
              style={{
                marginRight: 6
              }}
            >
              {item && totalNotes > 1
                ? totalNotes + " notes"
                : totalNotes === 1
                ? totalNotes + " note"
                : "0 notes"}
            </Paragraph>

            {item.pinned ? (
              <Icon
                name="pin-outline"
                size={SIZE.sm}
                style={{
                  marginRight: 10,
                  marginTop: 2
                }}
                color={colors.accent}
              />
            ) : null}
          </View>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <Paragraph
          color={colors.icon}
          size={SIZE.xs}
          style={{
            marginRight: 6
          }}
        >
          {item && totalNotes > 1
            ? totalNotes + " notes"
            : totalNotes === 1
            ? totalNotes + " note"
            : "0 notes"}
        </Paragraph>
        <IconButton
          color={colors.heading}
          name="dots-horizontal"
          testID={notesnook.ids.notebook.menu}
          size={SIZE.xl}
          onPress={() => showActionSheet(item)}
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
