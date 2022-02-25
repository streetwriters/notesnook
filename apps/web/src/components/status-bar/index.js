import { Box, Button, Flex, Text } from "rebass";
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
  showUpdateAvailableNotice,
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
      display={["none", "flex"]}
      sx={{ borderTop: "1px solid", borderTopColor: "border" }}
      justifyContent="space-between"
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
              display="flex"
              sx={{ alignItems: "center", justifyContent: "center" }}
            >
              <Circle
                size={7}
                color={user.isEmailConfirmed ? "success" : "warn"}
              />
              <Text variant="subBody" color="bgSecondaryText" ml={1}>
                {user.email}
                {user.isEmailConfirmed ? "" : " (not verified)"}
              </Text>
            </Button>

            <SyncStatus />
          </>
        ) : (
          <Button
            variant="statusitem"
            display="flex"
            onClick={() => hardNavigate("/login")}
            sx={{ alignItems: "center", justifyContent: "center" }}
          >
            <Circle size={7} color="error" />
            <Text variant="subBody" color="bgSecondaryText" ml={1}>
              Not logged in
            </Text>
          </Button>
        )}
        <Button
          variant="statusitem"
          display="flex"
          onClick={() => showIssueDialog()}
          sx={{ alignItems: "center", justifyContent: "center" }}
          title="Facing an issue? Click here to create a bug report."
        >
          <Issue size={12} />
          <Text variant="subBody" color="bgSecondaryText" ml={1}>
            Report an issue
          </Text>
        </Button>
        {statuses?.map(({ key, status, progress, icon }) => {
          const Icon = getIconFromAlias(icon);
          return (
            <Flex key={key} ml={1} alignItems="center" justifyContent="center">
              {Icon ? <Icon size={12} /> : <Loading size={12} />}
              <Text variant="subBody" color="bgSecondaryText" ml={1}>
                {progress ? `${progress}% ${status}` : status}
              </Text>
            </Flex>
          );
        })}

        {updateStatus && (
          <Button
            variant="statusitem"
            display="flex"
            onClick={async () => {
              if (updateStatus.type === "available") {
                await showUpdateAvailableNotice(updateStatus);
              } else if (updateStatus.type === "completed") {
                installUpdate();
              } else {
                checkForUpdate();
              }
            }}
            sx={{ alignItems: "center", justifyContent: "center" }}
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
            <Text variant="subBody" color="bgSecondaryText" ml={1}>
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
  const sync = useAppStore((state) => state.sync);
  const user = useUserStore((state) => state.user);

  const status = syncStatusFilters.find((f) =>
    f.check(syncStatus, user, lastSynced)
  );

  return (
    <Button
      variant="statusitem"
      display="flex"
      onClick={sync}
      sx={{ alignItems: "center", justifyContent: "center" }}
      title={status.tooltip}
      data-test-id={`sync-status-${status.key}`}
    >
      <status.icon size={12} color={status.iconColor} rotate={status.loading} />
      <Text variant="subBody" ml={1}>
        {typeof status.text === "string" ? (
          status.text
        ) : (
          <status.text lastSynced={lastSynced} />
        )}
      </Text>
    </Button>
  );
}

const syncStatusFilters = [
  {
    key: "synced",
    check: (syncStatus) => syncStatus === "synced",
    icon: Sync,
    text: ({ lastSynced }) => (
      <>
        {"Synced "}
        <TimeAgo live={true} datetime={lastSynced} />
      </>
    ),
    tooltip: "All changes are synced.",
  },
  {
    key: "syncing",
    check: (syncStatus) => syncStatus === "syncing",
    icon: Sync,
    loading: true,
    text: "Syncing",
    tooltip: "Syncing your notes...",
  },
  {
    key: "completed",
    check: (syncStatus) => syncStatus === "completed",
    icon: Checkmark,
    iconColor: "success",
    text: "Sync completed",
  },
  {
    key: "conflicts",
    check: (syncStatus) => syncStatus === "conflicts",
    icon: Alert,
    iconColor: "error",
    text: "Merge conflicts",
    tooltip: "Please resolve all merge conflicts and run the sync again.",
  },
  {
    key: "emailNotConfirmed",
    check: (_syncStatus, user) => !user.isEmailConfirmed,
    icon: Alert,
    iconColor: "warn",
    text: "Sync disabled",
    tooltip: "Please confirm your email to start syncing.",
  },
  {
    key: "neverSynced",
    check: (_syncStatus, _user, lastSynced) => !lastSynced,
    icon: Sync,
    text: "Synced never",
    tooltip: "Click to sync your notes.",
  },
  {
    key: "failed",
    check: (syncStatus) => syncStatus === "failed",
    icon: SyncError,
    color: "error",
    text: "Sync failed",
    tooltip: "Sync failed to completed. Please try again.",
  },
];
