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
import React, { RefObject } from "react";
import { ScrollView, View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import {
  presentSheet,
  PresentSheetOptions
} from "../../../services/event-manager";
import Notifications, { Reminder } from "../../../services/notifications";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import { ItemReference } from "../../../utils/types";
import List from "../../list";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

type ReminderSheetProps = {
  actionSheetRef: RefObject<ActionSheet>;
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
  const colors = useThemeStore((state) => state.colors);
  const references = db.relations?.to(reminder as ItemReference, "note") || [];

  const QuickActions = [
    {
      title: "5 min",
      time: 5
    },
    {
      title: "15 min",
      time: 15
    },
    {
      title: "30 min",
      time: 30
    },
    {
      title: "1 hour",
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
      db.reminders?.reminder(reminder?.id)
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
        <Icon name="bell" size={20} color={colors.accent} />
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
        <Paragraph size={SIZE.xs + 1}>Remind me in:</Paragraph>
        {QuickActions.map((item) => {
          return (
            <Button
              type="grayAccent"
              key={item.title}
              title={item.title}
              height={30}
              fontSize={SIZE.xs + 1}
              style={{ marginLeft: 10, borderRadius: 100 }}
              onPress={() => onSnooze(item.time)}
            />
          );
        })}
      </ScrollView>

      {references.length > 0 ? (
        <View
          style={{
            width: "100%",
            height:
              160 * references?.length < 500 ? 160 * references?.length : 500,
            borderTopWidth: 1,
            borderTopColor: colors.nav,
            marginTop: 5,
            paddingTop: 5
          }}
        >
          <Paragraph
            style={{
              color: colors.icon,
              fontSize: SIZE.xs + 1,
              marginBottom: 10
            }}
          >
            REFERENCED IN
          </Paragraph>
          <List
            listData={references}
            loading={false}
            type="notes"
            headerProps={null}
            isSheet={true}
            onMomentumScrollEnd={() =>
              actionSheetRef.current?.handleChildScrollEnd()
            }
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
