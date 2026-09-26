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
import { strings } from "@notesnook/intl";

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
        console.error("FAILED:", e);
        props.onClose(e as Error);
      }
    })();
  }, [props]);

  return (
    <Dialog
      isOpen={true}
      testId="progress-dialog"
      title={props.title}
      description={props.subtitle}
      onClose={() => {}}
    >
      <Flex
        sx={{
          flexDirection: "column",
          mt: "spacing6",
          mb: "spacing7",
          gap: "spacing7"
        }}
      >
        <Text
          sx={{
            color: "paragraph-secondary",
            fontSize: "xs",
            lineHeight: 1.5
          }}
        >
          {text}
        </Text>
        {current > 0 ? (
          <Box>
            <Box
              sx={{ width: "100%", bg: "background-secondary", mb: "spacing3" }}
            >
              <Box
                sx={{
                  borderRadius: "150px",
                  alignSelf: "start",
                  bg: "accent",
                  height: "7px",
                  width: `${(current / total) * 100}%`
                }}
              />
            </Box>
            <Text
              sx={{
                fontSize: "xs",
                color: "paragraph-secondary"
              }}
            >
              {current} {strings.of()} {total}
            </Text>
          </Box>
        ) : null}
      </Flex>
    </Dialog>
  );
});
