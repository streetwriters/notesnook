import React from "react";
import { Button, Flex, Text } from "rebass";
import EditorFooter from "../editor/footer";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { showLogInDialog } from "../../common/dialog-controller";
import TimeAgo from "timeago-react";
import { hashNavigate, navigate } from "../../navigation";

function StatusBar() {
  const user = useUserStore((state) => state.user);
  const sync = useAppStore((state) => state.sync);
  const lastSynced = useAppStore((state) => state.lastSynced);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const isSyncing = useAppStore((state) => state.isSyncing);

  return (
    <Flex
      bg="bgSecondary"
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
              <Text variant="subBody" ml={1}>
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
            onClick={showLogInDialog}
            sx={{ alignItems: "center", justifyContent: "center" }}
          >
            <Icon.Circle size={7} color="error" />
            <Text variant="subBody" ml={1}>
              Not logged in
            </Text>
          </Button>
        )}
      </Flex>
      <EditorFooter />
    </Flex>
  );
}

export default StatusBar;
