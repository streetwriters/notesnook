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

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import useSyncProgress from "../../../hooks/use-sync-progress";
import { presentSheet } from "../../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../../utils/size";
import Seperator from "../../ui/seperator";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
export const Progress = () => {
  const { colors } = useThemeColors();
  const { progress } = useSyncProgress();
  const [currentProgress, setCurrentProgress] = useState(0.1);

  useEffect(() => {
    const nextProgress = progress ? progress?.current / progress?.total : 0.1;

    setCurrentProgress((currentProgress) => {
      if (currentProgress > nextProgress) return currentProgress;
      return progress ? progress?.current / progress?.total : 0.1;
    });
  }, [progress]);

  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 25,
        paddingBottom: 15
      }}
    >
      <Heading size={AppFontSize.lg}>{strings.syncingHeading()}</Heading>
      <Paragraph>{strings.syncingDesc()}</Paragraph>
      <Seperator />
      <View
        style={{
          width: 200
        }}
      >
        <ProgressBarComponent
          height={5}
          width={null}
          animated={true}
          useNativeDriver
          indeterminate
          unfilledColor={colors.secondary.background}
          color={colors.primary.accent}
          borderWidth={0}
        />
      </View>

      {progress ? (
        <Paragraph color={colors.secondary.paragraph}>
          {strings.networkProgress(progress.type)} {progress?.current}
        </Paragraph>
      ) : null}
    </View>
  );
};

Progress.present = () => {
  presentSheet({
    component: <Progress />,
    disableClosing: true,
    context: "sync_progress"
  });
};
