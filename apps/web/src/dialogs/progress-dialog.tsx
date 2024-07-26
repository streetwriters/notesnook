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
import { Box, Flex, Text } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";

type Progress = {
  total?: number;
  current?: number;
  text: string;
};
type ProgressDialogProps<T> = BaseDialogProps<T | Error> & {
  title: string;
  subtitle?: string;
  action: (report: (progress: Progress) => void) => T;
};
export const ProgressDialog = DialogManager.register(function ProgressDialog<T>(
  props: ProgressDialogProps<T>
) {
  const [{ current = 0, total = 1, text }, setProgress] = useState<Progress>({
    text: ""
  });

  useEffect(() => {
    (async function () {
      try {
        props.onClose(await props.action(setProgress));
      } catch (e) {
        console.error(e);
        props.onClose(e as Error);
      }
    })();
  }, [props]);

  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      onClose={() => {}}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Text variant="body">{text}</Text>
        {current > 0 ? (
          <>
            <Text variant="subBody">
              {current} of {total}
            </Text>
            <Box
              sx={{
                alignSelf: "start",
                my: 1,
                bg: "accent",
                height: "2px",
                width: `${(current / total) * 100}%`
              }}
            />
          </>
        ) : (
          <Flex my={1} />
        )}
      </Flex>
    </Dialog>
  );
});
