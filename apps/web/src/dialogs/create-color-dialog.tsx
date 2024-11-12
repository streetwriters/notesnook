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

import { Box, Flex } from "@theme-ui/components";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { useRef } from "react";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

type CreateColorDialogProps = BaseDialogProps<string | false>;
export const CreateColorDialog = DialogManager.register(
  function CreateColorDialog(props: CreateColorDialogProps) {
    const colorRef = useRef<HTMLInputElement>(null);
    const colorPickerRef = useRef<HTMLInputElement>(null);
    return (
      <Dialog
        testId="new-color-dialog"
        isOpen={true}
        title={strings.newColor()}
        onClose={() => props.onClose(false)}
        positiveButton={{
          form: "colorForm",
          type: "submit",
          text: strings.create()
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
      >
        <Box
          as="form"
          id="colorForm"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = Object.fromEntries(
              new FormData(e.target as HTMLFormElement).entries()
            ) as { color: string; title: string };
            if (!validateHexColor(form.color)) {
              showToast("error", strings.invalidHexColor());
              return;
            }
            const colorId = await db.colors.add({
              colorCode: form.color,
              title: form.title
            });
            props.onClose(colorId || false);
          }}
        >
          <Field
            required
            label={strings.title()}
            id="title"
            name="title"
            autoFocus
            data-test-id="title-input"
          />
          <Flex sx={{ alignItems: "end" }}>
            <Field
              inputRef={colorRef}
              required
              label={strings.color()}
              id="color"
              name="color"
              data-test-id="color-input"
              sx={{ flex: 1 }}
              onChange={(e) => {
                const color = e.target.value;
                if (colorPickerRef.current && validateHexColor(color))
                  colorPickerRef.current.value = color;
              }}
            />
            <input
              ref={colorPickerRef}
              type="color"
              style={{
                height: 41,
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 5
              }}
              onChange={(e) => {
                if (colorRef.current) colorRef.current.value = e.target.value;
              }}
            />
          </Flex>
        </Box>
      </Dialog>
    );
  }
);

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
function validateHexColor(color: string) {
  return HEX_COLOR_REGEX.test(color);
}
