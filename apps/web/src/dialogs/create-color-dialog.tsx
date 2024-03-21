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
import { Perform } from "../common/dialog-controller";
import { useRef } from "react";
import tinycolor from "tinycolor2";
import { db } from "../common/db";

type CreateColorDialogProps = {
  onClose: Perform;
  onDone: Perform<string>;
};
function CreateColorDialog(props: CreateColorDialogProps) {
  const colorRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      testId="new-color-dialog"
      isOpen={true}
      title={"Create a new color"}
      onClose={() => props.onClose(false)}
      positiveButton={{
        form: "colorForm",
        type: "submit",
        text: "Create"
      }}
      negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
    >
      <Box
        as="form"
        id="colorForm"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = Object.fromEntries(
            new FormData(e.target as HTMLFormElement).entries()
          ) as { color: string; title: string };
          const colorId = await db.colors.add({
            colorCode: form.color,
            title: form.title
          });
          props.onDone(colorId);
        }}
      >
        <Field
          required
          label="Title"
          id="title"
          name="title"
          autoFocus
          data-test-id="title-input"
        />
        <Flex sx={{ alignItems: "end" }}>
          <Field
            inputRef={colorRef}
            required
            label="Color"
            id="color"
            name="color"
            data-test-id="color-input"
            sx={{ flex: 1 }}
            onChange={(e) => {
              const color = tinycolor(e.target.value);
              if (colorPickerRef.current && color.isValid())
                colorPickerRef.current.value = color.toHexString();
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

export default CreateColorDialog;
