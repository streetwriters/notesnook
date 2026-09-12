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
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect } from "react";
import { View } from "react-native";
import { PROGRESS_EVENTS } from ".";
import { Radius, Spacing } from "../../../common/design/spacing";
import { eSubscribeEvent } from "../../../services/event-manager";
import { AppFontSize } from "../../../utils/size";
import { Dialog } from "../../dialog";
import BaseDialog from "../../dialog/base-dialog";
import DialogContainer from "../../dialog/dialog-container";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export type ProgressOptions = {
  progress?: string;
  cancelCallback?: () => void;
  title?: string;
  paragraph?: string;
  fillBackground?: boolean;
  canHideProgress?: boolean;
  icon?: string;
};

export default function Progress() {
  const { colors } = useThemeColors();
  const [progress, setProgress] = React.useState<string | undefined>();
  const [visible, setVisible] = React.useState(false);
  const cancelCallback = React.useRef<() => void>(undefined);
  const [data, setData] = React.useState<{
    title?: string;
    paragraph?: string;
    fillBackground?: boolean;
    canHideProgress?: boolean;
    icon?: string;
  }>();

  useEffect(() => {
    const events = [
      eSubscribeEvent(PROGRESS_EVENTS.start, (options: ProgressOptions) => {
        setProgress(options.progress);
        cancelCallback.current = options.cancelCallback;

        setData({
          ...options
        });
        setVisible(true);
      }),
      eSubscribeEvent(PROGRESS_EVENTS.end, () => {
        setProgress(undefined);
        setVisible(false);
        setData(undefined);
        cancelCallback.current?.();
        cancelCallback.current = undefined;
      }),
      eSubscribeEvent(PROGRESS_EVENTS.update, (options: ProgressOptions) => {
        setProgress(options.progress);
        if (options.cancelCallback) {
          cancelCallback.current = options.cancelCallback;
        }

        const data: ProgressOptions = {};
        if (options.title) data.title = options.title;
        if (options.paragraph) data.paragraph = options.paragraph;
        if (options.fillBackground)
          data.fillBackground = options.fillBackground;
        if (options.icon) {
          data.icon = options.icon;
        }

        setData((current) => {
          return {
            ...current,
            ...data
          };
        });
      })
    ];
    return () => {
      events.forEach((event) => event?.unsubscribe());
      cancelCallback.current = undefined;
    };
  }, []);

  return !visible ? null : (
    <BaseDialog
      background={data?.fillBackground ? colors.primary.background : undefined}
      visible
    >
      <DialogContainer
        style={{
          padding: Spacing.LEVEL_4
        }}
        noBorder={data?.fillBackground ? true : false}
      >
        <Dialog context="local" />
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            gap: Spacing.LEVEL_4,
            paddingTop: Spacing.LEVEL_1
          }}
        >
          {data?.icon ? (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: Radius.XS,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary.background
              }}
            >
              <AppIcon
                name={data?.icon}
                iconFamily="notesnook"
                size={20}
                color={colors.primary.icon}
              />
            </View>
          ) : null}

          <View
            style={{
              gap: Spacing.LEVEL_1
            }}
          >
            <Heading
              style={{
                textAlign: "center"
              }}
              color={colors.primary.heading}
              size={AppFontSize.lg}
            >
              {data?.title}
            </Heading>
            <Paragraph
              style={{
                textAlign: "center"
              }}
              color={colors.secondary.paragraph}
            >
              {progress ? progress : data?.paragraph}
            </Paragraph>

            <View
              style={{
                flexDirection: "row",
                width: "100%"
              }}
            >
              <ProgressBarComponent
                height={8}
                width={null}
                style={{
                  flex: 1
                }}
                animated={true}
                useNativeDriver
                indeterminate
                indeterminateAnimationDuration={2000}
                unfilledColor={colors.secondary.background}
                color={colors.primary.accent}
                borderWidth={0}
              />
            </View>
          </View>

          {!data?.canHideProgress ? null : (
            <Button
              title={cancelCallback.current ? "Cancel" : "Hide"}
              type="accent"
              onPress={() => {
                if (cancelCallback.current) {
                  cancelCallback.current?.();
                }
                setVisible(false);
                setProgress(undefined);
                setData(undefined);
              }}
              width={160}
            />
          )}
        </View>
      </DialogContainer>
    </BaseDialog>
  );
}
