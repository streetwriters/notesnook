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

import { Box, Button, Flex, Text } from "@theme-ui/components";
import EditorFooter from "../editor/footer";
import {
  Circle,
  Sync,
  Loading,
  Update,
  SyncError,
  Checkmark,
  Alert,
  Issue,
  SyncOff
} from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useAppStore } from "../../stores/app-store";
import TimeAgo from "../time-ago";
import { hardNavigate, hashNavigate, navigate } from "../../navigation";
import useAutoUpdater from "../../hooks/use-auto-updater";
import installUpdate from "../../commands/install-update";
import checkForUpdate from "../../commands/check-for-update";
import {
  showIssueDialog,
  showUpdateAvailableNotice
} from "../../common/dialog-controller";
import useStatus from "../../hooks/use-status";
import { getIconFromAlias } from "../icons/resolver";

function StatusBar() {
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const statuses = useStatus();
  const updateStatus = useAutoUpdater();

  return (
    <Box
      bg="bgSecondary"
      sx={{
        borderTop: "1px solid",
        borderTopColor: "border",
        justifyContent: "space-between",
        display: ["none", "flex"]
      }}
      px={2}
    >
      <Flex>
        {isLoggedIn ? (
          <>
            <Button
              onClick={() =>
                user.isEmailConfirmed
                  ? navigate("/settings")
                  : hashNavigate("/email/verify")
              }
              variant="statusitem"
              sx={{
                alignItems: "center",
                justifyContent: "center",
                display: "flex"
              }}
            >
              <Circle
                size={7}
                color={user.isEmailConfirmed ? "success" : "warn"}
              />
              <Text
                className="selectable"
                variant="subBody"
                ml={1}
                sx={{ color: "bgSecondaryText" }}
              >
                {user.email}
                {user.isEmailConfirmed ? "" : " (not verified)"}
              </Text>
            </Button>

            <SyncStatus />
          </>
        ) : isLoggedIn === false ? (
          <Button
            variant="statusitem"
            onClick={() => hardNavigate("/login")}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              display: "flex"
            }}
            data-test-id="not-logged-in"
          >
            <Circle size={7} color="error" />
            <Text variant="subBody" ml={1} sx={{ color: "bgSecondaryText" }}>
              Not logged in
            </Text>
          </Button>
        ) : null}
        <Button
          variant="statusitem"
          onClick={() => showIssueDialog()}
          sx={{
            alignItems: "center",
            justifyContent: "center",
            display: "flex"
          }}
          title="Facing an issue? Click here to create a bug report."
        >
          <Issue size={12} />
          <Text variant="subBody" ml={1} sx={{ color: "bgSecondaryText" }}>
            Report an issue
          </Text>
        </Button>
        {statuses?.map(({ key, status, progress, icon }) => {
          const Icon = getIconFromAlias(icon);
          return (
            <Flex
              key={key}
              ml={1}
              sx={{ alignItems: "center", justifyContent: "center" }}
            >
              {Icon ? <Icon size={12} /> : <Loading size={12} />}
              <Text variant="subBody" ml={1} sx={{ color: "bgSecondaryText" }}>
                {progress ? `${progress}% ${status}` : status}
              </Text>
            </Flex>
          );
        })}

        {updateStatus && (
          <Button
            variant="statusitem"
            onClick={async () => {
              if (updateStatus.type === "available") {
                await showUpdateAvailableNotice(updateStatus);
              } else if (updateStatus.type === "completed") {
                installUpdate();
              } else {
                checkForUpdate();
              }
            }}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              display: "flex"
            }}
          >
            <Update
              rotate={
                updateStatus.type !== "updated" &&
                updateStatus.type !== "completed" &&
                updateStatus.type !== "available"
              }
              color={
                updateStatus.type === "available"
                  ? "primary"
                  : "bgSecondaryText"
              }
              size={12}
            />
            <Text variant="subBody" ml={1} sx={{ color: "bgSecondaryText" }}>
              {statusToInfoText(updateStatus)}
            </Text>
          </Button>
        )}
      </Flex>
      <EditorFooter />
    </Box>
  );
}

export default StatusBar;

function statusToInfoText(status) {
  const { type, version, progress = 0 } = status;
  return type === "checking"
    ? "Checking for updates..."
    : type === "updated"
    ? "You are on latest version"
    : type === "downloading"
    ? `${Math.round(progress)}% updating...`
    : type === "completed"
    ? `v${version} downloaded (restart required)`
    : type === "available"
    ? `v${version} available`
    : "";
}

function SyncStatus() {
  const syncStatus = useAppStore((state) => state.syncStatus);
  const lastSynced = useAppStore((state) => state.lastSynced);
  const isSyncEnabled = useAppStore((state) => state.isSyncEnabled);
  const sync = useAppStore((state) => state.sync);
  const user = useUserStore((state) => state.user);

  const status = syncStatusFilters.find((f) =>
    f.check(syncStatus.key, user, lastSynced)
  );

  return (
    <Button
      variant="statusitem"
      onClick={() => (isSyncEnabled ? sync() : null)}
      sx={{ alignItems: "center", justifyContent: "center", display: "flex" }}
      title={status.tooltip}
      data-test-id={`sync-status-${status.key}`}
    >
      {syncStatus.progress ? (
        <Text variant={"subBody"}>{syncStatus.progress}%</Text>
      ) : (
        <status.icon
          size={12}
          color={status.iconColor}
          rotate={status.loading}
        />
      )}
      <Text variant="subBody" ml={status.text ? "3px" : 0}>
        {status.text ? (
          <>
            {typeof status.text === "string" ? (
              status.text
            ) : (
              <status.text lastSynced={lastSynced} syncStatus={syncStatus} />
            )}{" "}
          </>
        ) : null}
      </Text>
    </Button>
  );
}

const syncStatusFilters = [
  {
    key: "synced",
    check: (syncStatus) => syncStatus === "synced",
    icon: Sync,
    text: ({ lastSynced }) =>
      lastSynced ? (
        <TimeAgo live={true} locale="en_short" datetime={lastSynced} />
      ) : (
        "click to sync"
      ),
    tooltip: "All changes are synced."
  },
  {
    key: "syncing",
    check: (syncStatus) => syncStatus === "syncing",
    icon: Sync,
    loading: true,
    text: ({ syncStatus }) => <>{syncStatus.type || "sync"}ing</>,
    tooltip: "Syncing your notes..."
  },
  {
    key: "completed",
    check: (syncStatus) => syncStatus === "completed",
    icon: Checkmark,
    iconColor: "success",
    text: ""
  },
  {
    key: "conflicts",
    check: (syncStatus) => syncStatus === "conflicts",
    icon: Alert,
    iconColor: "error",
    text: "Merge conflicts",
    tooltip: "Please resolve all merge conflicts and run the sync again."
  },
  {
    key: "emailNotConfirmed",
    check: (_syncStatus, user) => !user.isEmailConfirmed,
    icon: Alert,
    iconColor: "warn",
    text: "Sync disabled",
    tooltip: "Please confirm your email to start syncing."
  },
  {
    key: "failed",
    check: (syncStatus) => syncStatus === "failed",
    icon: SyncError,
    color: "error",
    text: "Sync failed",
    tooltip: "Sync failed to completed. Please try again."
  },
  {
    key: "offline",
    check: (syncStatus) => syncStatus === "offline",
    icon: SyncOff,
    text: ({ lastSynced }) => (
      <>
        <TimeAgo live={true} locale="en_short" datetime={lastSynced} />{" "}
        (offline)
      </>
    ),
    tooltip: "You are offline."
  },
  {
    key: "disabled",
    check: (syncStatus) => syncStatus === "disabled",
    icon: SyncOff,
    text: () => "Sync disabled",
    tooltip: "Sync is disabled."
  }
];
