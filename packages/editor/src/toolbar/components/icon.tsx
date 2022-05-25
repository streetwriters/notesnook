import MDIIcon from "@mdi/react";
import { Theme } from "@notesnook/theme";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { useTheme } from "emotion-theming";
import { Flex, FlexProps } from "rebass";

type IconProps = {
  title?: string;
  path: string;
  size?: keyof Theme["iconSizes"] | number;
  color?: keyof SchemeColors;
  stroke?: string;
  rotate?: boolean;
};
function MDIIconWrapper({
  title,
  path,
  size = 24,
  color = "icon",
  stroke,
  rotate,
}: IconProps) {
  const theme: Theme = useTheme();

  const themedColor: string = theme.colors
    ? (theme.colors[color] as string)
    : color;

  return (
    <MDIIcon
      className="icon"
      title={title}
      path={path}
      size={
        typeof size === "string" ? `${theme.iconSizes[size]}px` : `${size}px`
      }
      style={{
        strokeWidth: stroke || "0px",
        stroke: themedColor,
      }}
      color={themedColor}
      spin={rotate}
    />
  );
}

export type NNIconProps = FlexProps & IconProps;

export function Icon(props: NNIconProps) {
  const { sx, title, color, size, stroke, rotate, path, ...restProps } = props;

  return (
    <Flex
      sx={{
        flexShrink: 0,
        justifyContent: "center",
        alignItems: "center",
        ...sx,
      }}
      {...restProps}
    >
      <MDIIconWrapper
        title={title}
        path={path}
        rotate={rotate}
        color={color}
        stroke={stroke}
        size={size}
      />
    </Flex>
  );
}
