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

import { useRef, useState } from "react";
import { ColorPicker, Flex, Box } from "@notesnook/ui-kit";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { checkFeature } from "../common";
import { Field } from "./components/field";
import Dialog from "../components/dialog";

type CreateColorDialogProps = BaseDialogProps<string | false>;
export const CreateColorDialog = DialogManager.register(
  function CreateColorDialog(props: CreateColorDialogProps) {
    const title = useRef("");
    const [color, setColor] = useState("#666666");

    const onSubmit = async () => {
      if (!title.current.trim() || !color) return;
      if (!validateHexColor(color)) {
        showToast("error", strings.invalidHexColor());
        return;
      }

      const colorId = await db.colors.add({
        colorCode: color,
        title: title.current
      });
      props.onClose(colorId || false);
    };

    return (
      <Dialog
        testId="new-color-dialog"
        isOpen={true}
        title={strings.newColor()}
        onClose={() => props.onClose(false)}
        positiveButton={{
          text: strings.create(),
          onClick: onSubmit
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
      >
        <Flex
          sx={{
            mt: "spacing6",
            mb: "spacing7",
            flexDirection: "column",
            gap: "spacing4"
          }}
        >
          <Box
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <Field
              required
              label={strings.title()}
              id="title"
              autoFocus
              data-test-id="title-input"
              placeholder={strings.enterTitle()}
              onChange={({ target: { value: text } }) => (title.current = text)}
            />
          </Box>
          <Box
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <Field
              required
              label={strings.color()}
              value={color}
              id="color"
              data-test-id="color-input"
              placeholder={strings.selectColor()}
              onChange={(e) => setColor(e.target.value)}
              rightActions={[
                {
                  component: (
                    <ColorPicker
                      value={validateHexColor(color) ? color : "#666666"}
                      onChange={(value) => setColor(value)}
                      sx={{ width: 40, height: 33, mx: "spacing4" }}
                    />
                  ),
                  sx: { px: 0 }
                }
              ]}
            />
          </Box>
        </Flex>
      </Dialog>
    );
  },
  { onBeforeOpen: () => checkFeature("colors") }
);

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
function validateHexColor(color: string) {
  return HEX_COLOR_REGEX.test(color);
}
