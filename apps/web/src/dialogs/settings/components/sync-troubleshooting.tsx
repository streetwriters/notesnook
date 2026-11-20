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

import { IconBox } from "../../../components/settings-ui";
import { useState } from "react";
import { Box, Button, Flex, Link, Text } from "@theme-ui/components";
import { strings } from "@notesnook/intl";
import { useStore as useAppStore } from "../../../stores/app-store";
import { ConfirmDialog } from "../../confirm";
import {
  CloudArrowDown,
  CloudArrowUp,
  Icon,
  Loading,
  Warning
} from "../../../components/icons";

const forcePush = () =>
  ConfirmDialog.show({
    title: strings.areYouSure(),
    subtitle: strings.forceSyncNotice(),
    checks: {
      accept: { text: strings.understand(), default: false }
    },
    positiveButtonText: strings.continue(),
    negativeButtonText: strings.cancel()
  }).then((result) => {
    if (!result || !result.checks?.accept) return;
    return useAppStore.getState().sync({ force: true, type: "send" });
  });

const forcePull = () =>
  ConfirmDialog.show({
    title: strings.areYouSure(),
    subtitle: strings.forcePullChangesDesc(),
    checks: {
      accept: { text: strings.understand(), default: false }
    },
    positiveButtonText: strings.continue(),
    negativeButtonText: strings.cancel()
  }).then((result) => {
    if (!result || !result.checks?.accept) return;
    return useAppStore.getState().sync({ force: true, type: "fetch" });
  });

export function SyncTroubleshooting() {
  const [workIndex, setWorkIndex] = useState<number>();

  async function work(index: number, action: () => Promise<unknown> | void) {
    if (workIndex !== undefined) return;
    try {
      setWorkIndex(index);
      await action();
    } finally {
      setWorkIndex(undefined);
    }
  }

  return (
    <Flex
      data-test-id="setting-force-sync"
      sx={{
        flexDirection: "column",
        gap: "spacing6",
        px: "spacing5",
        py: "spacing6",
        border: "1px solid",
        borderColor: "border-secondary",
        borderRadius: "radius2"
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
        <Text
          variant="body"
          sx={{
            fontSize: "sm",
            fontWeight: 500,
            lineHeight: 1,
            color: "heading"
          }}
        >
          {strings.havingProblemsWithSync()}
        </Text>
        <Text
          variant="body"
          sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}
        >
          Use these options only if your notes aren’t syncing correctly
        </Text>
      </Flex>
      <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
        <TroubleshootingAction
          icon={CloudArrowDown}
          title={strings.forcePushChanges()}
          description="Upload this device's changes to the server"
          isLoading={workIndex === 0}
          onClick={() => work(0, forcePush)}
        />
        <Box
          sx={{ width: "1px", height: "70px", flexShrink: 0, bg: "border" }}
        />
        <TroubleshootingAction
          icon={CloudArrowUp}
          title={strings.forcePullChanges()}
          description="Replace local data with the latest server version."
          isLoading={workIndex === 1}
          onClick={() => work(1, forcePull)}
        />
      </Flex>
      <Box sx={{ height: "1px", bg: "border" }} />
      <Flex
        sx={{
          gap: "spacing3",
          p: "spacing4",
          bg: "background-secondary",
          borderRadius: "radius2"
        }}
      >
        <Warning size={15} sx={{ flexShrink: 0 }} />
        <Text
          variant="body"
          sx={{ flex: 1, fontSize: "xs", lineHeight: 1.24, color: "paragraph" }}
        >
          These actions are intended for troubleshooting and should only be used
          if recommended. If syncing issues continue,{" "}
          <Link
            href="mailto:support@streetwriters.co"
            sx={{ color: "accent", textDecoration: "none" }}
          >
            contact support
          </Link>{" "}
          with your debug logs.
        </Text>
      </Flex>
    </Flex>
  );
}

function TroubleshootingAction(props: {
  icon: Icon;
  title: string;
  description: string;
  isLoading: boolean;
  onClick: () => void;
}) {
  const { icon: ActionIcon, title, description, isLoading, onClick } = props;
  return (
    <Flex
      sx={{ flex: 1, minWidth: 0, gap: "spacing3", alignItems: "flex-start" }}
    >
      <IconBox>
        <ActionIcon size={15} />
      </IconBox>
      <Flex
        sx={{ flex: 1, minWidth: 0, flexDirection: "column", gap: "spacing6" }}
      >
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          <Text
            variant="body"
            sx={{
              fontSize: "sm",
              fontWeight: 500,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {title}
          </Text>
          <Text
            variant="body"
            sx={{ fontSize: "xs", lineHeight: 1.2, color: "paragraph" }}
          >
            {description}
          </Text>
        </Flex>
        <Button
          variant="secondary"
          title={title}
          disabled={isLoading}
          onClick={onClick}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-start",
            px: "spacing4",
            py: "spacing5",
            bg: "transparent",
            color: "buttonForeground-secondary",
            fontSize: "sm",
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: "nowrap",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "radius2",
            ":hover:not(:disabled)": { bg: "hover" }
          }}
        >
          <Text
            as="span"
            sx={{
              fontSize: "inherit",
              fontWeight: "inherit",
              color: "inherit",
              visibility: isLoading ? "hidden" : "visible"
            }}
          >
            {title}
          </Text>
          {isLoading ? (
            <Loading size={13} sx={{ position: "absolute" }} />
          ) : null}
        </Button>
      </Flex>
    </Flex>
  );
}
