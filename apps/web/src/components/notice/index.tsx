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
import { Button, Flex, Text } from "@theme-ui/components";
import { useStore as useAppStore } from "../../stores/app-store";
import { NoticesData } from "../../common/notices";
import { Dismiss } from "../icons";
import Config from "../../utils/config";
import { strings } from "@notesnook/intl";

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
      sx={{
        cursor: "pointer",
        borderRadius: "large",
        ":hover": { bg: "hover" },
        alignItems: "center",
        bg: "background-secondary",
        border: "1px solid var(--border)",
        mx: 1,
        mb: 1,
        p: 1,
        gap: 1
      }}
      onClick={() => NoticeData.action()}
    >
      <Flex sx={{ flex: 1, alignItems: "center", gap: 2 }}>
        <NoticeData.icon size={20} color="accent" sx={{ ml: 1 }} />
        <Flex
          variant="columnCenter"
          sx={{ alignItems: "flex-start", overflow: "hidden" }}
        >
          <Text
            variant="subBody"
            sx={{
              display: "block",
              textWrap: "wrap"
            }}
          >
            {NoticeData.subtitle}
          </Text>
          <Text
            variant="body"
            sx={{
              color: "heading-secondary",
              textWrap: "wrap"
            }}
          >
            {NoticeData.title}
          </Text>
        </Flex>
      </Flex>
      {NoticeData.dismissable && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            const dontShowAgain = window.confirm(
              strings.dontShowAgainConfirm()
            );
            dismissNotices(notice);
            if (dontShowAgain) {
              Config.set(`ignored:${NoticeData.key}`, true);
            }
          }}
          sx={{
            borderRadius: 50,
            p: 1,
            bg: "transparent"
          }}
          variant="secondary"
        >
          <Dismiss size={20} color="icon" />
        </Button>
      )}
    </Flex>
  );
}
export default Notice;
