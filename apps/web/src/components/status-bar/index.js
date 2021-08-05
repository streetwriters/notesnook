import React from "react";
import { Box, Button, Flex, Text } from "rebass";
import EditorFooter from "../editor/footer";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useAppStore } from "../../stores/app-store";
import TimeAgo from "timeago-react";
import { hashNavigate, navigate } from "../../navigation";
import useAutoUpdater from "../../hooks/use-auto-updater";
import downloadUpdate from "../../commands/download-update";
import installUpdate from "../../commands/install-update";

function StatusBar() {
  const user = useUserStore((state) => state.user);
  const sync = useAppStore((state) => state.sync);
  const lastSynced = useAppStore((state) => state.lastSynced);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const processingStatus = useAppStore((state) => state.processingStatus);
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
              <Icon.Circle
                size={7}
                color={user.isEmailConfirmed ? "success" : "warn"}
              />
              <Text variant="subBody" color="bgSecondaryText" ml={1}>
                {user.email}
                {user.isEmailConfirmed ? "" : " (not verified)"}
              </Text>
            </Button>
            <Button
              variant="statusitem"
              display="flex"
              onClick={sync}
              sx={{ alignItems: "center", justifyContent: "center" }}
            >
              <Icon.Sync size={10} rotate={isSyncing} />
              <Text variant="subBody" ml={1}>
                {"Synced "}
                {lastSynced ? (
                  <TimeAgo live={true} datetime={lastSynced} />
                ) : (
                  "never"
                )}
              </Text>
            </Button>
          </>
        ) : (
          <Button
            variant="statusitem"
            display="flex"
            onClick={() => navigate("/login")}
            sx={{ alignItems: "center", justifyContent: "center" }}
          >
            <Icon.Circle size={7} color="error" />
            <Text variant="subBody" color="bgSecondaryText" ml={1}>
              Not logged in
            </Text>
          </Button>
        )}
        {processingStatus && (
          <Flex ml={1} alignItems="center" justifyContent="center">
            <Icon.Loading size={12} />
            <Text variant="subBody" color="bgSecondaryText" ml={1}>
              {processingStatus}
            </Text>
          </Flex>
        )}

        {updateStatus && (
          <Button
            variant="statusitem"
            display="flex"
            onClick={() => {
              if (updateStatus.type === "available") {
                downloadUpdate();
              } else if (updateStatus.type === "completed") {
                installUpdate();
              }
            }}
            sx={{ alignItems: "center", justifyContent: "center" }}
          >
            <Icon.Update
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
