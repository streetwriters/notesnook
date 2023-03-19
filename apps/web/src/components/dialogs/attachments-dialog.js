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

import { useEffect } from "react";
import { Flex } from "@theme-ui/components";
import { getTotalSize } from "../../common/attachments";
import { useStore } from "../../stores/attachment-store";
import { formatBytes } from "../../utils/filename";
import Field from "../field";
import ListContainer from "../list-container";
import Dialog from "./dialog";
import Placeholder from "../placeholders";

function AttachmentsDialog({ onClose }) {
  const attachments = useStore((store) => store.attachments);
  const refresh = useStore((store) => store.refresh);
  const filter = useStore((store) => store.filter);
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Dialog
      isOpen={true}
      width={500}
      title="Attachments"
      description={`${attachments.length} attachments | ${formatBytes(
        getTotalSize(attachments)
      )} occupied`}
      onClose={onClose}
      noScroll
      negativeButton={{ text: "Close", onClick: onClose }}
    >
      <Flex px={2} sx={{ flexDirection: "column", height: 500 }}>
        <Field
          placeholder="Filter attachments by filename, type or hash"
          sx={{ mb: 1, px: 1 }}
          onChange={(e) => filter(e.target.value)}
        />
        <ListContainer
          header={<div />}
          type="attachments"
          groupType="attachments"
          placeholder={<Placeholder context="attachments" />}
          items={attachments}
        />
      </Flex>
    </Dialog>
  );
}

export default AttachmentsDialog;
