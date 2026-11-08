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
import { ColorPicker, Dialog, Flex } from "@ui";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { checkFeature } from "../common";
import { Field } from "./components/field";

type CreateColorDialogProps = BaseDialogProps<string | false>;
export const CreateColorDialog = DialogManager.register(
  function CreateColorDialog(props: CreateColorDialogProps) {
    const title = useRef("");
    const [color, setColor] = useState("#666666");
    const [fieldKey, setFieldKey] = useState(0);

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
        testID="new-color-dialog"
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
          <Field
            required
            label={strings.title()}
            id="title"
            autoFocus
            testID="title-input"
            placeholder={strings.enterTitle()}
            onChangeText={(text) => (title.current = text)}
            onSubmit={() => onSubmit()}
          />
          <Field
            key={fieldKey}
            required
            label={strings.color()}
            defaultValue={color}
            id="color"
            testID="color-input"
            placeholder={strings.selectColor()}
            onChangeText={setColor}
            onSubmit={() => onSubmit()}
            rightActions={[
              {
                component: (
                  <ColorPicker
                    value={validateHexColor(color) ? color : "#666666"}
                    onChange={(value) => {
                      setColor(value);
                      setFieldKey((k) => k + 1);
                    }}
                    sx={{ width: 40, height: 33, mx: "spacing4" }}
                  />
                ),
                sx: { px: 0 }
              }
            ]}
          />
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
