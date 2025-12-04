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

import { getFormattedDate, usePromise } from "@notesnook/common";
import { DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import Dialog from "../components/dialog";
import { Button, Flex, Text } from "@theme-ui/components";
import { Loader } from "../components/loader";
import { ScrollContainer } from "@notesnook/ui";
import { ErrorText } from "../components/error-text";
import { Cellphone, FileWebClip, Monitor } from "../components/icons";
import { logger, UserSession } from "@notesnook/core";
import { showToast } from "../utils/toast";
import { useState } from "react";
import { strings } from "@notesnook/intl";

export const UserSessionsDialog = DialogManager.register(
  function UserSessionsDialog(props) {
    const sessions = usePromise(() => db.user.getSessions());

    return (
      <Dialog
        isOpen={true}
        title={strings.loginSessions()}
        description={strings.loginSessionsDesc()}
        onClose={() => props.onClose(false)}
        negativeButton={{
          text: "Close",
          onClick: () => props.onClose(false)
        }}
        width={500}
      >
        <ScrollContainer
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: 400
          }}
        >
          {sessions.status === "pending" ? (
            <Loader title={strings.loading()} />
          ) : sessions.status === "rejected" ? (
            <ErrorText error={sessions.reason} />
          ) : !sessions.value ? (
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                py: 4,
                color: "paragraph"
              }}
            >
              <Text variant="body">{strings.somethingWentWrong()}</Text>
            </Flex>
          ) : (
            <Flex sx={{ flexDirection: "row", gap: 2, flexWrap: "wrap" }}>
              {sessions.value.map((session) => (
                <SessionItem
                  key={session.sessionKey}
                  session={session}
                  onLogout={sessions.refresh}
                />
              ))}
            </Flex>
          )}
        </ScrollContainer>
      </Dialog>
    );
  }
);

function SessionItem({
  session,
  onLogout
}: {
  session: UserSession;
  onLogout: () => void;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const type = session.browser?.toLowerCase().includes("electron")
    ? "desktop"
    : session.platform?.toLowerCase().includes("ios") ||
      session.platform?.toLowerCase().includes("android")
    ? "mobile"
    : "web";

  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: 1,
        p: 3,
        borderRadius: "default",
        border: "1px solid",
        borderColor: "border"
      }}
    >
      <Flex sx={{ alignItems: "center", gap: 1 }}>
        {type === "desktop" ? (
          <Monitor size={16} />
        ) : type === "mobile" ? (
          <Cellphone size={16} />
        ) : (
          <FileWebClip size={16} />
        )}
        <Text
          variant="subtitle"
          sx={{
            fontWeight: "bold",
            color: session.isCurrentDevice ? "accent" : "heading"
          }}
        >
          {session.browser || "Unknown Browser"}
        </Text>
        {session.isCurrentDevice && (
          <Text
            variant="subBody"
            sx={{
              py: 0.8,
              px: 1,
              color: "accent",
              border: "1px solid",
              borderColor: "accent",
              fontWeight: "bold",
              borderRadius: "default"
            }}
          >
            Current Device
          </Text>
        )}
      </Flex>

      {session.platform && (
        <Text variant="body" sx={{ color: "paragraph" }}>
          {session.platform}
        </Text>
      )}

      <Flex sx={{ gap: 2 }}>
        <Text variant="subBody" sx={{ color: "fontTertiary" }}>
          Created: {getFormattedDate(session.createdAt, "date-time")}
        </Text>
      </Flex>

      {!session.isCurrentDevice && (
        <Button
          variant="errorSecondary"
          onClick={async () => {
            try {
              setIsLoggingOut(true);
              await db.user.logoutSession(session.sessionKey);
              showToast("success", strings.sessionLoggedOut());
              onLogout();
            } catch (e) {
              if (e instanceof Error) {
                logger.error(e, "Failed to logout session:");
              }
              showToast("error", strings.failedToLogoutSession());
            } finally {
              setIsLoggingOut(false);
            }
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? strings.loggingOut() : strings.logout()}
        </Button>
      )}
    </Flex>
  );
}
