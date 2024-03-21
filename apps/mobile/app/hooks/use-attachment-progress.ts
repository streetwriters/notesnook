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

import { useEffect, useState } from "react";
import { useAttachmentStore } from "../stores/use-attachment-store";
import { Attachment } from "@notesnook/core";

type AttachmentProgress = {
  type: string;
  value?: number;
  percent?: string;
};

export const useAttachmentProgress = (
  attachment?: Attachment,
  encryption?: boolean
): [
  AttachmentProgress | undefined,
  (progress?: AttachmentProgress) => void
] => {
  const progress = useAttachmentStore((state) => state.progress);
  const [currentProgress, setCurrentProgress] = useState<
    AttachmentProgress | undefined
  >(
    encryption
      ? {
          type: "encrypt"
        }
      : undefined
  );

  useEffect(() => {
    const attachmentProgress = !attachment
      ? null
      : progress?.[attachment?.hash];
    if (attachmentProgress) {
      const type = attachmentProgress.type;
      const loaded =
        attachmentProgress.type === "download"
          ? attachmentProgress.recieved
          : attachmentProgress.sent;
      const value = loaded / attachmentProgress.total;
      setCurrentProgress({
        value: value * 100,
        percent: (value * 100).toFixed(0) + "%",
        type: type
      });
    } else {
      setTimeout(() => {
        setCurrentProgress(undefined);
      }, 300);
    }
  }, [attachment, progress]);

  return [currentProgress, setCurrentProgress];
};
