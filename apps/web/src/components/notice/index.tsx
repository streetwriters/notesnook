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
        borderRadius: "default",
        ":hover": { bg: "hover" },
        alignItems: "center"
        // minWidth: 250
      }}
      p={1}
      onClick={() => NoticeData.action()}
      mx={1}
    >
      <Flex sx={{ flex: 1, alignItems: "center" }}>
        <NoticeData.icon
          size={18}
          color="accent"
          sx={{ bg: "shade", mr: 2, p: 2, borderRadius: 80 }}
        />
        <Flex
          variant="columnCenter"
          sx={{ alignItems: "flex-start", overflow: "hidden" }}
        >
          <Text
            variant="body"
            sx={{
              fontSize: "body",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {NoticeData.title}
          </Text>
          <Text
            variant="subBody"
            sx={{
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {NoticeData.subtitle}
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
            mr: 1,
            bg: "transparent"
          }}
          variant="accentSecondary"
        >
          <Dismiss size={20} color="accent" />
        </Button>
      )}
    </Flex>
  );
}
export default Notice;
