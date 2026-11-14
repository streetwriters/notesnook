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

import { forwardRef, useCallback, useRef, useState } from "react";
import { View } from "react-native";
import WheelColorPicker from "react-native-wheel-color-picker";
import type * as Contract from "../../../ui/primitives";
import type { UIElement } from "../../../ui/primitives";
import { Popover } from "./popover";
import { Box } from "./primitives";

export const ColorPicker = forwardRef<UIElement, Contract.ColorPickerProps>(
  function ColorPicker(props, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<UIElement | null>(null);
    const emitted = useRef(props.value);
    const wheelColor = useRef(props.value);
    if (props.value !== emitted.current) {
      emitted.current = props.value;
      wheelColor.current = props.value;
    }

    const setRefs = useCallback(
      (node: UIElement | null) => {
        anchorRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    return (
      <>
        <Box
          ref={setRefs}
          testID={props.testID}
          onPress={() => setIsOpen((open) => !open)}
          sx={{
            width: 40,
            height: 33,
            borderRadius: "radius2",
            bg: props.value as never,
            border: "1px solid",
            borderColor: "border",
            ...props.sx
          }}
        />
        <Popover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          anchorRef={anchorRef}
          placement="bottom-end"
          sx={{ p: "spacing4" }}
        >
          <View style={{ width: 260, height: 250 }}>
            <WheelColorPicker
              color={wheelColor.current}
              onColorChange={(color: string) => {
                if (color === emitted.current) return;
                emitted.current = color;
                props.onChange(color);
              }}
              useNativeLayout={true}
              autoResetSlider={true}
              sliderSize={30}
              thumbSize={25}
              shadeWheelThumb
              shadeSliderThumb
              swatchesOnly={false}
              swatches={false}
              useNativeDriver={false}
              sliderStyle={{ marginBottom: 12, paddingHorizontal: 12 }}
            />
          </View>
        </Popover>
      </>
    );
  }
);
