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
import dayjs from "dayjs";
import React, { RefObject, useEffect, useState } from "react";
import { View } from "react-native";
import { ActionSheetRef, ScrollView } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import {
  presentSheet,
  PresentSheetOptions
} from "../../../services/event-manager";
import Notifications from "../../../services/notifications";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../../utils/size";
import List from "../../list";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import {
  Reminder,
  ItemReference,
  VirtualizedGrouping,
  Note
} from "@notesnook/core";
import { strings } from "@notesnook/intl";

type ReminderSheetProps = {
  actionSheetRef: RefObject<ActionSheetRef>;
  close?: () => void;
  update?: (options: PresentSheetOptions) => void;
  reminder?: Reminder;
};
export default function ReminderNotify({
  actionSheetRef,
  close,
  update,
  reminder
}: ReminderSheetProps) {
  const { colors } = useThemeColors();
  const [references, setReferences] = useState<VirtualizedGrouping<Note>>();

  useEffect(() => {
    db.relations
      ?.to(reminder as ItemReference, "note")
      .selector.grouped(db.settings.getGroupOptions("notes"))
      .then((items) => {
        setReferences(items);
      });
  }, [reminder]);

  const QuickActions = [
    {
      title: `5 ${strings.timeShort.minute()}`,
      time: 5
    },
    {
      title: `15 ${strings.timeShort.minute()}`,
      time: 15
    },
    {
      title: `30 ${strings.timeShort.minute()}`,
      time: 30
    },
    {
      title: `1 ${strings.timeShort.hour()}`,
      time: 60
    }
  ];

  const onSnooze = async (time: number) => {
    const snoozeTime = Date.now() + time * 60000;
    await db.reminders?.add({
      ...reminder,
      snoozeUntil: snoozeTime
    });
    await Notifications.scheduleNotification(
      await db.reminders?.reminder(reminder?.id as string)
    );
    close?.();
  };

  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12
      }}
    >
      <Heading>{reminder?.title}</Heading>
      {reminder?.description && <Paragraph>{reminder?.description}</Paragraph>}

      <View
        style={{
          height: 40,
          borderRadius: 100,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <Icon name="bell" size={20} color={colors.primary.accent} />
        <Paragraph style={{ marginLeft: 5 }}>
          {dayjs(reminder?.date).format("ddd, YYYY-MM-DD hh:mm A")}
        </Paragraph>
      </View>

      <ScrollView
        nestedScrollEnabled
        horizontal={true}
        contentContainerStyle={{
          alignItems: "center",
          paddingVertical: 10
        }}
        showsHorizontalScrollIndicator={false}
        style={{
          marginTop: 10
        }}
      >
        <Paragraph size={AppFontSize.xs}>{strings.remindMeIn()}:</Paragraph>
        {QuickActions.map((item) => {
          return (
            <Button
              type="secondaryAccented"
              key={item.title}
              title={item.title}
              height={30}
              fontSize={AppFontSize.xs}
              style={{ marginLeft: 10, borderRadius: 100 }}
              onPress={() => onSnooze(item.time)}
            />
          );
        })}
      </ScrollView>

      {references?.placeholders && references?.placeholders?.length > 0 ? (
        <View
          style={{
            width: "100%",
            height:
              160 * references?.placeholders?.length < 500
                ? 160 * references?.placeholders?.length
                : 500,
            borderTopWidth: 1,
            borderTopColor: colors.primary.border,
            marginTop: 5,
            paddingTop: 5
          }}
        >
          <Paragraph
            style={{
              color: colors.secondary.paragraph,
              fontSize: AppFontSize.xs,
              marginBottom: 10
            }}
          >
            {strings.referencedIn()}
          </Paragraph>
          <List
            data={references}
            CustomListComponent={FlashList}
            loading={false}
            dataType="note"
            isRenderedInActionSheet={true}
          />
        </View>
      ) : null}
    </View>
  );
}

ReminderNotify.present = (reminder?: Reminder) => {
  presentSheet({
    component: (ref, close, update) => (
      <ReminderNotify
        actionSheetRef={ref}
        close={close}
        update={update}
        reminder={reminder}
      />
    )
  });
};
