declare module "react-native-wheel-color-picker" {
  import type { ComponentType } from "react";
  import type { ViewStyle } from "react-native";

  export interface WheelColorPickerProps {
    color?: string;
    onColorChange?: (color: string) => void;
    onColorChangeComplete?: (color: string) => void;
    useNativeLayout?: boolean;
    useNativeDriver?: boolean;
    autoResetSlider?: boolean;
    sliderSize?: number;
    thumbSize?: number;
    shadeWheelThumb?: boolean;
    shadeSliderThumb?: boolean;
    swatchesOnly?: boolean;
    swatches?: boolean;
    sliderStyle?: ViewStyle;
  }
  const WheelColorPicker: ComponentType<WheelColorPickerProps>;
  export default WheelColorPicker;
}
