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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { LayoutAnimation, View } from "react-native";
import { MMKV } from "../../common/database/mmkv";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { eCloseSheet } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import walkthroughs, { TStep } from "./walkthroughs";
export const Walkthrough = ({
  steps,
  canSkip = true
}: {
  steps: TStep[];
  canSkip: boolean;
}) => {
  const { colors } = useThemeColors();
  const [step, setStep] = useState<TStep>(steps && steps[0]);

  const next = () => {
    const index = steps.findIndex((s) => s.text === step.text);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(steps[index + 1]);
  };

  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      {step.walkthroughItem(colors)}

      {step.title ? (
        <Heading
          style={{
            textAlign: "center"
          }}
        >
          {step.title}
        </Heading>
      ) : null}
      {step.text ? (
        <Paragraph
          style={{
            textAlign: "center",
            alignSelf: "center",
            maxWidth: "80%"
          }}
          size={AppFontSize.md}
        >
          {step.text}
        </Paragraph>
      ) : null}
      {step.actionButton && (
        <Button
          style={{
            height: 30
          }}
          textStyle={{
            textDecorationLine: "underline"
          }}
          onPress={async () => {
            step.actionButton?.action();
          }}
          type="transparent"
          title={step.actionButton.text}
        />
      )}

      <Button
        onPress={async () => {
          switch (step.button?.type) {
            case "next":
              next();
              return;
            case "done":
              eSendEvent(eCloseSheet);
              await sleep(300);
              step.button?.action && step.button.action();
              return;
          }
        }}
        width={250}
        title={step.button?.title}
        type="accent"
      />

      {canSkip ? (
        <Button
          style={{
            paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
          }}
          textStyle={{
            textDecorationLine: "underline"
          }}
          onPress={async () => {
            eSendEvent(eCloseSheet);
          }}
          type="plain"
          title={strings.skipIntroduction()}
        />
      ) : null}
    </View>
  );
};
let walkthroughState: { [name: string]: boolean } = {};

Walkthrough.update = async (
  id: "notebooks" | "trialstarted" | "emailconfirmed" | "prouser"
) => {
  if (walkthroughState[id]) return;
  walkthroughState[id] = true;
  MMKV.setItem("walkthroughState", JSON.stringify(walkthroughState));
};

Walkthrough.init = async () => {
  const json = MMKV.getString("walkthroughState");
  if (json) {
    walkthroughState = JSON.parse(json);
  }
};

Walkthrough.present = async (
  id: "emailconfirmed" | "prouser",
  canSkip = true,
  nopersist?: boolean
) => {
  // if (!nopersist) {
  //   if (!walkthroughState || Object.keys(walkthroughState).length === 0) {
  //     await Walkthrough.init();
  //   }
  //   if (walkthroughState[id]) return;
  //   Walkthrough.update(id);
  // }
  const walkthrough = walkthroughs[id]();
  if (!walkthrough) return;
  presentSheet({
    component: <Walkthrough canSkip={canSkip} steps={walkthrough.steps} />,
    disableClosing: true
  });
};
