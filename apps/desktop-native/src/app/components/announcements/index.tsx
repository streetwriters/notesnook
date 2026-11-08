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

import { strings } from "@notesnook/intl";
import { Flex } from "@ui";
import { Cross } from "../icons";
import AnnouncementBody, { ANNOUNCEMENT_DISMISS_COLORS } from "./body";
import { useStore as useAnnouncementStore } from "../../stores/announcement-store";

function Announcements() {
  const announcements = useAnnouncementStore(
    (store) => store.inlineAnnouncements
  );
  const dismiss = useAnnouncementStore((store) => store.dismiss);
  const announcement = announcements[0];

  if (!announcement) return null;
  return (
    <Flex
      sx={{
        mx: 1,
        mb: 2,
        py: 2,
        bg: "background-secondary",
        borderRadius: "default",
        position: "relative",
        flexDirection: "column"
      }}
    >
      <Flex
        title={strings.dismissAnnouncement()}
        onPress={() => dismiss(announcement.id)}
        sx={{
          p: "2px",
          bg: ANNOUNCEMENT_DISMISS_COLORS.background,
          position: "absolute",
          right: 2,
          top: 2,
          borderRadius: 50,
          cursor: "pointer",
          alignSelf: "flex-end"
        }}
      >
        <Cross size={16} color={ANNOUNCEMENT_DISMISS_COLORS.icon} />
      </Flex>
      <AnnouncementBody components={announcement.body} type="inline" />
    </Flex>
  );
}

export default Announcements;
