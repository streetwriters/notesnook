import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useSyncProgress from "../../hooks/use-sync-progress";
import { eSendEvent } from "../../services/event-manager";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { eOpenLoginDialog } from "../../utils/events";
import { tabBarRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";
import { TimeSince } from "../ui/time-since";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
export const UserStatus = () => {
  const colors = useThemeStore((state) => state.colors);
  const user = useUserStore((state) => state.user);
  const syncing = useUserStore((state) => state.syncing);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const insets = useSafeAreaInsets();
  const { progress } = useSyncProgress();
  console.log("SYNC PROGRESS", progress);
  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingBottom: Platform.OS === "ios" ? insets.bottom / 2 : null,
        borderTopWidth: 1,
        borderTopColor: colors.nav
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <PressableButton
          onPress={async () => {
            if (user) {
              Sync.run();
            } else {
              tabBarRef.current?.closeDrawer();
              eSendEvent(eOpenLoginDialog);
            }
          }}
          type="gray"
          customStyle={{
            flexDirection: "row",
            justifyContent: "flex-start",
            padding: 12,
            paddingHorizontal: 20,
            borderRadius: 0
          }}
        >
          <View
            style={{
              flexShrink: 1,
              flexGrow: 1
            }}
          >
            <Heading
              style={{
                flexWrap: "wrap"
              }}
              size={SIZE.xs}
              color={colors.icon}
            >
              {!user ? (
                "You are not logged in"
              ) : !syncing ? (
                lastSynced && lastSynced !== "Never" ? (
                  <>
                    Last synced{" "}
                    <TimeSince
                      style={{ fontSize: SIZE.xs, color: colors.icon }}
                      time={lastSynced}
                    />
                  </>
                ) : (
                  "never"
                )
              ) : (
                `Syncing your notes${
                  progress ? ` (${progress.current}/${progress.total})` : ""
                }`
              )}{" "}
              <Icon
                name="checkbox-blank-circle"
                size={9}
                color={!user ? colors.red : colors.green}
              />
            </Heading>

            <Paragraph
              style={{
                flexWrap: "wrap"
              }}
              color={colors.heading}
            >
              {!user
                ? "Login to sync your notes."
                : "Tap here to sync your notes."}
            </Paragraph>
          </View>

          {user ? (
            syncing ? (
              <>
                <ActivityIndicator color={colors.accent} size={SIZE.xl} />
              </>
            ) : (
              <Icon color={colors.accent} name="sync" size={SIZE.lg} />
            )
          ) : null}
        </PressableButton>
      </View>
    </View>
  );
};
