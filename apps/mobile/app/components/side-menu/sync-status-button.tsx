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
import { useTimeAgo } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { useNetInfo } from "@react-native-community/netinfo";
import React from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import Sync from "../../services/sync";
import { SyncStatus, useUserStore } from "../../stores/use-user-store";
import { AppFontSize } from "../../utils/size";
import NativeTooltip from "../../utils/tooltip";
import AppIcon from "../ui/AppIcon";
import { IconButton } from "../ui/icon-button";

const SyncStatusButton = () => {
  const { colors } = useThemeColors();
  const [user, syncing, lastSyncStatus, lastSynced, isLoggingOut] =
    useUserStore((state) => [
      state.user,
      state.syncing,
      state.lastSyncStatus,
      state.lastSynced,
      state.isLoggingOut
    ]);

  const { isInternetReachable } = useNetInfo();
  const isOffline = !isInternetReachable;
  const hasSyncedBefore = lastSynced && lastSynced !== "Never";

  const isFailed = lastSyncStatus === SyncStatus.Failed;
  const isSynced = lastSyncStatus === SyncStatus.Passed;
  const lastSyncedTimeAgo = useTimeAgo(lastSynced, {
    interval: 5000,
    live: true
  });

  const getIconColor = (): string => {
    if (syncing) return colors.primary.accent;
    if (isSynced) return colors.primary.accent;
    return colors.secondary.icon;
  };

  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (syncing && !isOffline) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(360, {
        duration: 1000 * (1 - (rotation.value % 360) / 360),
        easing: Easing.linear
      });
    }
  }, [syncing, rotation, isOffline]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const tooltipText = React.useMemo(() => {
    const offlineSuffix = isOffline ? ` (${strings.offline()})` : "";

    if (syncing) return strings.syncing();
    if (!hasSyncedBefore) return `${strings.never()}${offlineSuffix}`;
    if (isFailed) return `${strings.syncFailed()}${offlineSuffix}`;
    return `${strings.synced()} • ${lastSyncedTimeAgo}${offlineSuffix ? ` • ${offlineSuffix}` : ""}`;
  }, [isOffline, syncing, hasSyncedBefore, isFailed, lastSyncedTimeAgo]);

  const onPress = () => {
    if (syncing) return;
    Sync.run();
  };

  if (!user || isLoggingOut) return null;

  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        position: "relative"
      }}
    >
      {syncing ? (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.primary.border,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Animated.View style={rotationStyle}>
            <AppIcon name="sync" size={AppFontSize.lg} color={getIconColor()} />
          </Animated.View>
        </View>
      ) : (
        <IconButton
          name="sync"
          onPress={onPress}
          tooltipText={tooltipText}
          tooltipPosition={NativeTooltip.POSITIONS.BOTTOM}
          size={AppFontSize.lg}
          color={getIconColor()}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.primary.border
          }}
        />
      )}

      {!syncing && (isFailed || isOffline) ? (
        <AppIcon
          name="information"
          color={isOffline ? colors.static.yellow : colors.error.icon}
          size={AppFontSize.xxs}
          style={{ position: "absolute", bottom: -3, right: -3 }}
        />
      ) : null}
    </View>
  );
};

export default SyncStatusButton;
