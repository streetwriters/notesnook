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

import { Flex } from "@notesnook/ui";
import { StatusBarItem } from "./status-bar-item";
import EditorFooter from "../editor/footer";
import {
  Loading,
  SyncError,
  Icon,
  MobileLock,
  LockOpen,
  ArrowsClockwise,
  WarningOctagon,
  SyncDisabled,
  ClockClockwise
} from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import { useAutoUpdater, UpdateStatus } from "../../hooks/use-auto-updater";
import useStatus, { statusToString } from "../../hooks/use-status";
import { ScopedThemeProvider } from "../theme-provider";
import { checkForUpdate, installUpdate } from "../../utils/updater";
import { getTimeAgo, toTitleCase } from "@notesnook/common";
import { User } from "@notesnook/core";
import { showUpdateAvailableNotice } from "../../dialogs/confirm";
import { strings } from "@notesnook/intl";
import { useVault } from "../../hooks/use-vault";
import { useKeyStore } from "../../interfaces/key-store";
import { STATUS_BAR_HEIGHT } from "../../common/constants";

function StatusBar() {
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const statuses = useStatus();
  const updateStatus = useAutoUpdater();
  const isFocusMode = useAppStore((state) => state.isFocusMode);
  const { isVaultLocked, lockVault } = useVault();
  const { activeCredentials, relock } = useKeyStore();

  return (
    <ScopedThemeProvider
      scope="statusBar"
      bg="background"
      sx={{
        borderTop: "1px solid",
        borderTopColor: "border-secondary",
        justifyContent: "space-between",
        alignItems: "center",
        display: ["none", "flex", "flex"],
        flexShrink: 0,
        px: "spacing4",
        py: "spacing1",
        height: STATUS_BAR_HEIGHT
      }}
    >
      {isFocusMode ? (
        <Flex />
      ) : (
        <Flex sx={{ gap: "spacing3" }}>
          {isLoggedIn ? (
            <>
              <SyncStatus />
              {!user?.isEmailConfirmed && (
                <StatusBarItem
                  variant="button"
                  onClick={() => hashNavigate("/email/verify")}
                  text={strings.emailNotConfirmed()}
                />
              )}
            </>
          ) : null}
          {activeCredentials().length > 0 && (
            <StatusBarItem
              variant="button"
              icon={MobileLock}
              onClick={relock}
              title={"Lock app"}
              data-test-id="lock-app"
            />
          )}
          {statuses?.map((status) => {
            const { key, icon: Icon } = status;
            return (
              <StatusBarItem
                key={key}
                variant="button"
                icon={Icon || Loading}
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
              onClick={async () => {
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
              onClick={lockVault}
              data-test-id="vault-unlocked"
            />
          )}
        </Flex>
      )}
      <EditorFooter />
    </ScopedThemeProvider>
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
      onClick={() => (isSyncEnabled ? sync() : null)}
      title={
        (status.text
          ? status.text({ lastSynced, type: syncStatus.type })
          : status.tooltip) +
        (syncStatus.progress ? ` (${syncStatus.progress})` : "")
      }
      data-test-id={`sync-status-${status.key}`}
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
  tooltip: string;
  iconColor?: string;
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
        ? `Synced ${getTimeAgo(lastSynced, "en_short", { minInterval: 1000 })}`
        : "click to sync",
    tooltip: "All changes are synced."
  },
  {
    key: "syncing",
    isActive: (syncStatus) => syncStatus === "syncing",
    icon: ArrowsClockwise,
    loading: true,
    text: ({ type }) => `${toTitleCase(type || "sync")}ing`,
    tooltip: "Syncing your notes..."
  },
  {
    key: "conflicts",
    isActive: (syncStatus) => syncStatus === "conflicts",
    icon: WarningOctagon,
    iconColor: "var(--icon-error)",
    text: () => "Merge conflicts",
    tooltip: "Please resolve all merge conflicts and run the sync again."
  },
  {
    key: "emailNotConfirmed",
    isActive: (_syncStatus, user) => !user?.isEmailConfirmed,
    icon: WarningOctagon,
    iconColor: "var(--icon-error)",
    text: () => "Sync disabled",
    tooltip: "Please confirm your email to start syncing."
  },
  {
    key: "failed",
    isActive: (syncStatus) => syncStatus === "failed",
    icon: SyncError,
    iconColor: "var(--icon-error)",
    text: () => "Sync failed",
    tooltip: "Sync failed to completed. Please try again."
  },
  {
    key: "offline",
    isActive: (syncStatus) => syncStatus === "offline",
    icon: SyncDisabled,
    text: ({ lastSynced }) =>
      `Synced ${getTimeAgo(lastSynced, "en_short", {
        minInterval: 1000
      })} (offline)`,
    tooltip: "You are offline."
  },
  {
    key: "disabled",
    iconColor: "var(--icon-disabled)",
    isActive: (syncStatus) => syncStatus === "disabled",
    icon: SyncDisabled,
    text: () => "Sync disabled",
    tooltip: "Sync is disabled."
  }
];
