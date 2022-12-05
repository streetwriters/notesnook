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
import React, { RefObject, useState } from "react";
import { View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import { db } from "../../../common/database";
import {
  presentSheet,
  PresentSheetOptions
} from "../../../services/event-manager";
import DialogHeader from "../../dialog/dialog-header";
import List from "../../list";
import { useEffect } from "react";
import { Reminder } from "../../../services/notifications";
import { PressableButtonProps } from "../../ui/pressable";
import SheetProvider from "../../sheet-provider";

type RelationsListProps = {
  actionSheetRef: RefObject<ActionSheet>;
  close?: () => void;
  update?: (options: PresentSheetOptions) => void;
  item: { id: string; type: string };
  referenceType: string;
  relationType: "to" | "from";
  title: string;
  button?: Button;
};

type Button = {
  onPress?: (() => void) | undefined;
  loading?: boolean | undefined;
  title?: string | undefined;
  type?: PressableButtonProps["type"];
};

export const RelationsList = ({
  actionSheetRef,
  close,
  update,
  item,
  referenceType,
  relationType,
  title,
  button
}: RelationsListProps) => {
  const [items, setItems] = useState<Reminder[]>([]);

  useEffect(() => {
    db.relations?.[relationType]?.(
      { id: item?.id, type: item.type },
      referenceType
    ).then((items) => setItems(items as any));
  }, [item?.id, item?.type, referenceType, relationType]);
  return (
    <View style={{ paddingHorizontal: 12, height: "100%" }}>
      <SheetProvider context="local" />
      <DialogHeader title={title} button={button} />
      <List
        listData={items}
        loading={false}
        type={referenceType}
        headerProps={null}
        isSheet={true}
      />
    </View>
  );
};

RelationsList.present = ({
  reference,
  referenceType,
  relationType,
  title,
  button
}: {
  reference: { id: string; type: string };
  referenceType: string;
  relationType: "to" | "from";
  title: string;
  button: Button;
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
      />
    )
  });
};
