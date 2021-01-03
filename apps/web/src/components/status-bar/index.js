import React from "react";
import { Button, Flex, Text } from "rebass";
import EditorFooter from "../editor/footer";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { showLogInDialog } from "../dialogs/logindialog";
import TimeAgo from "timeago-react";
import { hashNavigate, navigate } from "../../navigation";

function StatusBar() {
  const user = useUserStore((state) => state.user);
  const sync = useUserStore((state) => state.sync);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const isSyncing = useUserStore((state) => state.isSyncing);

  return (
    <Flex
      bg="bgSecondary"
      sx={{ borderTop: "1px solid", borderTopColor: "border" }}
      justifyContent="space-between"
      px={2}
    >
      {isLoggedIn ? (
        <Flex>
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
        </Flex>
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
      <EditorFooter />
    </Flex>
  );
}

export default StatusBar;
