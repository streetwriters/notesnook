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

import { useMemo } from "react";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@ui";
import { useStore as useAppStore } from "../../stores/app-store";
import { NoticesData } from "../../common/notices";
import { Dismiss } from "../icons";
import Config from "../../utils/config";
import { ConfirmDialog } from "../../dialogs/confirm";

function Notice() {
  const notices = useAppStore((store) => store.notices);
  const dismissNotices = useAppStore((store) => store.dismissNotices);
  const notice = useMemo(() => {
    if (!notices) return null;
    return notices.slice().sort((a, b) => a.priority - b.priority)[0];
  }, [notices]);

  if (!notice) return null;
  const NoticeData = NoticesData[notice.type];
  return (
    <Flex
      testID="notice"
      onPress={() => NoticeData.action()}
      sx={{
        flexDirection: "row",
        cursor: "pointer",
        borderRadius: "large",
        ":hover": { bg: "hover" },
        alignItems: "center",
        bg: "background-secondary",
        border: "1px solid",
        borderColor: "border",
        mx: 1,
        mb: 1,
        p: 1,
        gap: 1
      }}
    >
      <Flex
        sx={{
          flexDirection: "row",
          flex: 1,
          alignItems: "center",
          gap: 2
        }}
      >
        <NoticeData.icon size={20} color="accent" sx={{ ml: 1 }} />
        <Flex
          sx={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            overflow: "hidden"
          }}
        >
          <Text variant="subBody">{NoticeData.subtitle}</Text>
          <Text variant="body" sx={{ color: "heading-secondary" }}>
            {NoticeData.title}
          </Text>
        </Flex>
      </Flex>
      {NoticeData.dismissable && (
        <Button
          onPress={async (event) => {
            event.stopPropagation();
            const dontShowAgain = await ConfirmDialog.show({
              title: strings.dontShowAgainConfirm(),
              positiveButtonText: strings.yes(),
              negativeButtonText: strings.no()
            });
            dismissNotices(notice);
            if (dontShowAgain) {
              Config.set(`ignored:${NoticeData.key}`, true);
            }
          }}
          variant="secondary"
          sx={{ borderRadius: 50, p: 1, bg: "transparent" }}
        >
          <Dismiss size={20} color="icon" />
        </Button>
      )}
    </Flex>
  );
}
export default Notice;
