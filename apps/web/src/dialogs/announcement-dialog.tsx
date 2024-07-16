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

import { Flex } from "@theme-ui/components";
import AnnouncementBody from "../components/announcements/body";
import { store as announcementStore } from "../stores/announcement-store";
import { useCallback } from "react";
import BaseDialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";

type AnnouncementDialogProps = BaseDialogProps<boolean> & {
  announcement: any;
};
export const AnnouncementDialog = DialogManager.register(
  function AnnouncementDialog(props: AnnouncementDialogProps) {
    const { announcement, onClose } = props;

    const dismiss = useCallback(() => {
      announcementStore.get().dismiss(announcement.id);
      onClose(true);
    }, [announcement, onClose]);

    return (
      <BaseDialog isOpen onClose={() => onClose(false)} width={"30%"}>
        <Flex
          bg="background"
          sx={{
            position: "relative",
            flexDirection: "column"
          }}
        >
          <AnnouncementBody
            dismiss={dismiss}
            components={announcement.body}
            type="dialog"
          />
        </Flex>
      </BaseDialog>
    );
  }
);
