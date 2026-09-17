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

import { Box } from "@theme-ui/components";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { useRef } from "react";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { checkFeature } from "../common";
import { Palette } from "../components/icons";

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
          sx={{
            mt: "spacing6",
            mb: "spacing7",
            display: "flex",
            flexDirection: "column",
            gap: "spacing4"
          }}
        >
          <Field
            required
            label={strings.title()}
            id="title"
            name="title"
            autoFocus
            data-test-id="title-input"
            sx={{
              input: {
                fontSize: "sm",
                px: "spacing4",
                py: "spacing6"
              }
            }}
            placeholder={strings.enterTitle()}
          />
          <Field
            inputRef={colorRef}
            required
            label={strings.color()}
            id="color"
            name="color"
            data-test-id="color-input"
            placeholder="Select color"
            onChange={(e) => {
              const color = e.target.value;
              if (colorPickerRef.current && validateHexColor(color))
                colorPickerRef.current.value = color;
            }}
            rightActions={[
              {
                component: (
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: "100%"
                    }}
                  >
                    <Palette size={15} />
                    <input
                      ref={colorPickerRef}
                      type="color"
                      aria-label={strings.color()}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        borderRadius: "10px"
                      }}
                      onChange={(e) => {
                        if (colorRef.current)
                          colorRef.current.value = e.target.value;
                      }}
                    />
                  </Box>
                ),
                sx: { px: 0 }
              }
            ]}
            sx={{
              input: {
                fontSize: "sm",
                px: "spacing4",
                py: "spacing6"
              }
            }}
          />
        </Box>
      </Dialog>
    );
  },
  { onBeforeOpen: () => checkFeature("colors") }
);

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
function validateHexColor(color: string) {
  return HEX_COLOR_REGEX.test(color);
}
