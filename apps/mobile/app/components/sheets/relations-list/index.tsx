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
import React, { RefObject, useEffect, useState } from "react";
import { View } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import {
  PresentSheetOptions,
  presentSheet
} from "../../../services/event-manager";
import { useRelationStore } from "../../../stores/use-relation-store";
import { AppFontSize } from "../../../utils/size";
import DialogHeader from "../../dialog/dialog-header";
import List from "../../list";
import SheetProvider from "../../sheet-provider";
import { Button } from "../../ui/button";
import { PressableProps } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";

type RelationsListProps = {
  actionSheetRef: RefObject<ActionSheetRef>;
  close?: () => void;
  update?: (options: PresentSheetOptions) => void;
  item: { id: string; type: string };
  referenceType: string;
  relationType: "to" | "from";
  title: string;
  button?: Button;
  onAdd: () => void;
};

type Button = {
  onPress?: (() => void) | undefined;
  loading?: boolean | undefined;
  title?: string | undefined;
  type?: PressableProps["type"];
  icon?: string;
};

const IconsByType = {
  reminder: "bell"
};

export const RelationsList = ({
  actionSheetRef,
  item,
  referenceType,
  relationType,
  title,
  button,
  onAdd
}: RelationsListProps) => {
  const updater = useRelationStore((state) => state.updater);
  const { colors } = useThemeColors();

  const [items, setItems] = useState<VirtualizedGrouping<Item>>();

  const hasNoRelations = !items || items?.placeholders?.length === 0;

  useEffect(() => {
    db.relations?.[relationType]?.(
      { id: item?.id, type: item?.type } as ItemReference,
      referenceType as any
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
    <View style={{ paddingHorizontal: 12, height: "100%" }}>
      <SheetProvider context="local" />
      <DialogHeader
        title={title}
        button={hasNoRelations ? undefined : button}
      />
      {hasNoRelations ? (
        <View
          style={{
            height: "85%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Icon
            name={IconsByType[referenceType as keyof typeof IconsByType]}
            size={60}
            color={colors.primary.icon}
          />
          <Paragraph>{strings.noLinksFound()}</Paragraph>
          <Button
            onPress={() => {
              onAdd?.();
            }}
            fontSize={AppFontSize.sm}
            //  width="100%"
            type="inverted"
            icon="plus"
            title={strings.addItem(
              referenceType as "notebook" | "tag" | "reminder" | "note"
            )}
          />
        </View>
      ) : (
        <List
          data={items}
          CustomListComponent={FlashList}
          loading={false}
          dataType={referenceType as any}
          isRenderedInActionSheet={true}
        />
      )}
    </View>
  );
};

RelationsList.present = ({
  reference,
  referenceType,
  relationType,
  title,
  button,
  onAdd
}: {
  reference: { id: string; type: string };
  referenceType: string;
  relationType: "to" | "from";
  title: string;
  button?: Button;
  onAdd: () => void;
}) => {
  presentSheet({
    component: (ref, close, update) => (
      <RelationsList
        actionSheetRef={ref}
        close={close}
        update={update}
        item={reference}
        referenceType={referenceType}
        relationType={relationType}
        title={title}
        button={button}
        onAdd={onAdd}
      />
    )
  });
};
