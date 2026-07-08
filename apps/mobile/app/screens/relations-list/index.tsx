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
import { Item, ItemReference, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../common/database";
import { Header } from "../../components/header";
import List from "../../components/list";
import { Button } from "../../components/ui/button";
import Paragraph from "../../components/ui/typography/paragraph";
import Navigation, { NavigationProps } from "../../services/navigation";
import { useRelationStore } from "../../stores/use-relation-store";
import { AppFontSize } from "../../utils/size";
import AppIcon from "../../components/ui/AppIcon";
import CirclesBackground from "../../components/ui/circles-background";
import Heading from "../../components/ui/typography/heading";
import { Spacing } from "../../common/design/spacing";

type RelationsListProps = {
  item: Item;
  referenceType: "notebook" | "tag" | "reminder" | "note";
  relationType: "to" | "from";
  title: string;
  listEmptyTitle?: string;
  listEmptyParagraph?: string;
  onAdd?: () => void;
};

const IconsByType = {
  reminder: "bell"
};

function RelationsList(props: NavigationProps<"RelationsList">) {
  const {
    item,
    referenceType,
    relationType,
    title,
    onAdd,
    listEmptyTitle,
    listEmptyParagraph
  } = props.route.params as RelationsListProps;
  const updater = useRelationStore((state) => state.updater);
  const { colors } = useThemeColors();
  const [items, setItems] = useState<VirtualizedGrouping<Item>>();
  const hasNoRelations = !items || items?.placeholders?.length === 0;
  console.log(listEmptyTitle, listEmptyParagraph);

  useEffect(() => {
    db.relations?.[relationType]?.(
      { id: item?.id, type: item?.type } as ItemReference,
      referenceType
    )
      .selector.sorted({
        sortBy: "dateEdited",
        sortDirection: "desc"
      })
      .then((grouped) => {
        setTimeout(() => {
          setItems(grouped);
        }, 300);
      });
  }, [relationType, referenceType, item?.id, item?.type, updater]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.primary.background,
        width: "100%"
      }}
    >
      <Header
        title={title}
        canGoBack
        style={{
          backgroundColor: colors.primary.background
        }}
      />
      <View style={{ flex: 1 }}>
        {hasNoRelations ? (
          <View
            style={{
              height: "85%",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: Spacing.LEVEL_3,
              paddingHorizontal: Spacing.LEVEL_3 * 2,
              marginTop: 46
            }}
          >
            <CirclesBackground>
              <AppIcon
                name={IconsByType[referenceType as keyof typeof IconsByType]}
                iconFamily="notesnook"
                size={18}
                color={colors.primary.accentForeground}
              />
            </CirclesBackground>

            <View
              style={{
                gap: Spacing.LEVEL_1,
                alignItems: "center"
              }}
            >
              <Heading fontSize="XL">{listEmptyTitle}</Heading>
              <Paragraph
                style={{
                  textAlign: "center",
                  maxWidth: 270
                }}
                fontSize="SM"
              >
                {listEmptyParagraph}
              </Paragraph>
            </View>
            <Button
              onPress={onAdd}
              fontSize={AppFontSize.md}
              type="accent"
              style={{
                marginTop: Spacing.LEVEL_0
              }}
              title={strings.addItem(referenceType)}
            />
          </View>
        ) : (
          <List
            data={items}
            loading={false}
            groupType={
              referenceType === "note"
                ? "notes"
                : referenceType === "tag"
                  ? "tags"
                  : referenceType === "notebook"
                    ? "notebooks"
                    : referenceType === "reminder"
                      ? "reminders"
                      : "notes"
            }
            dataType={referenceType}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

RelationsList.present = ({
  item,
  relationType,
  referenceType,
  title,
  listEmptyTitle,
  listEmptyParagraph,
  onAdd
}: RelationsListProps) => {
  Navigation.navigate("RelationsList", {
    item,
    relationType,
    referenceType,
    listEmptyTitle,
    listEmptyParagraph,
    title,
    onAdd
  });
};

export default RelationsList;
