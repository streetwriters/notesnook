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

import { getTimeAgo } from "@notesnook/common";
import type { User } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, ThemeScope, type ColorValue } from "@ui";
import { StatusBarItem } from "./status-bar-item";
import {
  ArrowsClockwise,
  ClockClockwise,
  LockOpen,
  Loading,
  SyncDisabled,
  SyncError,
  WarningOctagon,
  type Icon
} from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import {
  useAutoUpdater,
  type UpdateStatus
} from "../../hooks/use-auto-updater";
import useStatus, { statusToString } from "../../hooks/use-status";
import { checkForUpdate, installUpdate } from "../../utils/updater";
import { showUpdateAvailableNotice } from "../../dialogs/confirm";
import { useVault } from "../../hooks/use-vault";
import { STATUS_BAR_HEIGHT } from "../../common/constants";

export { STATUS_BAR_HEIGHT };

export function StatusBar() {
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const statuses = useStatus();
  const updateStatus = useAutoUpdater();
  const isFocusMode = useAppStore((state) => state.isFocusMode);
  const { isVaultLocked, lockVault } = useVault();

  return (
    <ThemeScope scope="statusBar">
      <Flex
        testID="status-bar"
        sx={{
          flexDirection: "row",
          bg: "background",
          borderTop: "1px solid",
          borderTopColor: "border-secondary",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          px: "spacing4",
          py: "spacing1",
          height: STATUS_BAR_HEIGHT
        }}
      >
        {isFocusMode ? (
          <Flex />
        ) : (
          <Flex sx={{ flexDirection: "row", gap: "spacing3" }}>
            {isLoggedIn ? (
              <>
                <SyncStatus />
                {!user?.isEmailConfirmed && (
                  <StatusBarItem
                    variant="button"
                    onPress={() => hashNavigate("/email/verify")}
                    text={strings.emailNotConfirmed()}
                  />
                )}
              </>
            ) : null}
            {statuses?.map((status) => {
              const { key, icon: StatusIcon } = status;
              return (
                <StatusBarItem
                  key={key}
                  variant="button"
                  icon={StatusIcon || Loading}
                  iconProps={{ rotate: true }}
                  text={statusToString(status)}
                />
              );
            })}

            {updateStatus && updateStatus?.type !== "updated" && (
              <StatusBarItem
                variant="button"
                icon={ClockClockwise}
                iconProps={{
                  rotate:
                    updateStatus.type !== "completed" &&
                    updateStatus.type !== "available",
                  rotateDirection: "counterclockwise",
                  color: updateStatus.type === "available" ? "accent" : "icon"
                }}
                text={statusToInfoText(updateStatus)}
                onPress={async () => {
                  if (updateStatus.type === "available") {
                    await showUpdateAvailableNotice(updateStatus);
                  } else if (updateStatus.type === "completed") {
                    installUpdate();
                  } else {
                    checkForUpdate();
                  }
                }}
              />
            )}
            {!isVaultLocked && (
              <StatusBarItem
                variant="button"
                icon={LockOpen}
                text={strings.vaultUnlocked()}
                onPress={lockVault}
                testID="vault-unlocked"
              />
            )}
          </Flex>
        )}
        <Flex />
      </Flex>
    </ThemeScope>
  );
}

export default StatusBar;

function statusToInfoText(status: UpdateStatus) {
  const { type } = status;
  return type === "checking"
    ? strings.checkingForUpdates()
    : type === "downloading"
    ? strings.updating(Math.round(status.progress))
    : type === "completed"
    ? strings.updateCompleted(status.version)
    : type === "available"
    ? strings.updateNewVersionAvailable(status.version)
    : "";
}

function SyncStatus() {
  const syncStatus = useAppStore((state) => state.syncStatus);
  const lastSynced = useAppStore((state) => state.lastSynced);
  const isSyncEnabled = useAppStore((state) => state.isSyncEnabled);
  const sync = useAppStore((state) => state.sync);
  const user = useUserStore((state) => state.user);

  const status = syncStatusFilters.find((f) =>
    f.isActive(syncStatus.key, user, lastSynced)
  );

  if (!status) return null;
  return (
    <StatusBarItem
      variant="button"
      icon={status.icon}
      iconProps={{
        rotate: status.loading,
        rotateDirection: "counterclockwise",
        color: status.iconColor
      }}
      onPress={() => (isSyncEnabled ? sync() : null)}
      title={
        (status.text
          ? status.text({ lastSynced, type: syncStatus.type })
          : status.tooltip()) +
        (syncStatus.progress ? ` (${syncStatus.progress})` : "")
      }
      testID={`sync-status-${status.key}`}
    />
  );
}

type SyncStatus =
  | "synced"
  | "syncing"
  | "conflicts"
  | "failed"
  | "completed"
  | "offline"
  | "disabled";
type SyncStatusFilter = {
  key: SyncStatus | "emailNotConfirmed";
  icon: Icon;
  isActive: (
    syncStatus: SyncStatus,
    user: User | undefined,
    lastSynced: number
  ) => boolean;
  text?: (props: {
    type?: "download" | "upload" | "sync";
    lastSynced: number;
  }) => string;
  tooltip: () => string;
  iconColor?: ColorValue;
  loading?: boolean;
};

const syncStatusFilters: SyncStatusFilter[] = [
  {
    key: "synced",
    isActive: (syncStatus) =>
      syncStatus === "synced" || syncStatus === "completed",
    icon: ArrowsClockwise,
    text: ({ lastSynced }) =>
      lastSynced
        ? `${strings.synced()} ${getTimeAgo(lastSynced, "short", {
            minInterval: 1000
          })}`
        : strings.clickToSync(),
    tooltip: () => strings.allChangesSynced()
  },
  {
    key: "syncing",
    isActive: (syncStatus) => syncStatus === "syncing",
    icon: ArrowsClockwise,
    loading: true,
    text: ({ type }) => strings.networkProgress(type || "sync"),
    tooltip: () => strings.syncingNotes()
  },
  {
    key: "conflicts",
    isActive: (syncStatus) => syncStatus === "conflicts",
    icon: WarningOctagon,
    iconColor: "icon-error",
    text: () => strings.mergeConflicts(),
    tooltip: () => strings.resolveConflictsAndResync()
  },
  {
    key: "emailNotConfirmed",
    isActive: (_syncStatus, user) => !user?.isEmailConfirmed,
    icon: WarningOctagon,
    iconColor: "icon-error",
    text: () => strings.syncIsDisabled(),
    tooltip: () => strings.confirmEmailToSync()
  },
  {
    key: "failed",
    isActive: (syncStatus) => syncStatus === "failed",
    icon: SyncError,
    iconColor: "icon-error",
    text: () => strings.syncFailed(),
    tooltip: () => strings.syncFailedTryAgain()
  },
  {
    key: "offline",
    isActive: (syncStatus) => syncStatus === "offline",
    icon: SyncDisabled,
    text: ({ lastSynced }) =>
      lastSynced
        ? `${strings.synced()} ${getTimeAgo(lastSynced, "short", {
            minInterval: 1000
          })} (${strings.offline()})`
        : `${strings.clickToSync()} (${strings.offline()})`,
    tooltip: () => strings.youAreOffline()
  },
  {
    key: "disabled",
    iconColor: "icon-disabled",
    isActive: (syncStatus) => syncStatus === "disabled",
    icon: SyncDisabled,
    text: () => strings.syncIsDisabled(),
    tooltip: () => strings.syncIsDisabled()
  }
];
