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

import Modal from "react-modal";
import { useTheme } from "@emotion/react";
import { Flex } from "@theme-ui/components";
import AnnouncementBody from "../announcements/body";
import { store as announcementStore } from "../../stores/announcement-store";
import { useCallback } from "react";

function AnnouncementDialog(props) {
  const { announcement, onClose } = props;
  const theme = useTheme();

  const dismiss = useCallback(() => {
    announcementStore.get().dismiss(announcement.id);
    onClose(true);
  }, [announcement, onClose]);

  return (
    <Modal
      isOpen={true}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e) => {
        if (!props.onClose) return;
        // we need this work around because ReactModal content spreads over the overlay
        const child = e.contentEl.firstElementChild;
        e.contentEl.onmousedown = function (e) {
          if (!e.screenX && !e.screenY) return;
          if (
            e.x < child.offsetLeft ||
            e.x > child.offsetLeft + child.clientWidth ||
            e.y < child.offsetTop ||
            e.y > child.offsetTop + child.clientHeight
          ) {
            props.onClose();
          }
        };
      }}
      style={{
        content: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          backgroundColor: undefined,
          padding: 0,
          overflowY: "hidden",
          border: 0,
          zIndex: 0
        },
        overlay: {
          zIndex: 999,
          background: theme.colors.overlay
        }
      }}
    >
      <Flex
        bg="background"
        sx={{
          position: "relative",
          overflow: "hidden",
          boxShadow: "4px 5px 18px 2px #00000038",
          borderRadius: "dialog",
          flexDirection: "column",
          width: ["100%", "80%", "30%"],
          maxHeight: ["100%", "80%", "80%"],
          alignSelf: "center",
          overflowY: "auto"
        }}
      >
        <AnnouncementBody
          dismiss={dismiss}
          components={announcement.body}
          type="dialog"
        />
      </Flex>
    </Modal>
  );
}
export default AnnouncementDialog;
