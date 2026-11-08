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

import {
  Children,
  forwardRef,
  useState,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
  type ReactNode
} from "react";
import {
  Image as NativeImage,
  Pressable,
  Switch as NativeSwitch,
  Text as NativeText,
  TextInput,
  View
} from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Path, SvgXml } from "react-native-svg";
import { shell } from "@platform";
import type * as Contract from "../../../ui/primitives";
import type { UIElement } from "../../../ui/primitives";
import { useThemeContext } from "./theme";
import {
  InheritedTextStyle,
  pressHandler,
  useInheritedTextStyle,
  useStyled,
  wrapChildren
} from "./style/use-styled";

const AnyView = View as any;

function resolveLineHeight(style: Record<string, any>) {
  if (typeof style.lineHeight === "number" && style.lineHeight < 5)
    return {
      ...style,
      lineHeight:
        style.lineHeight *
        (typeof style.fontSize === "number" ? style.fontSize : 16)
    };
  return style;
}
const AnyPressable = Pressable as any;
const AnyText = NativeText as any;
const AnyInput = TextInput as any;
const AnimatedView = Animated.View as any;
const AnimatedText = Animated.Text as any;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable) as any;

function useElementRef(ref: ForwardedRef<UIElement>) {
  const inner = useRef<{
    focus?: () => void;
    blur?: () => void;
    measureInWindow?: (
      callback: (x: number, y: number, width: number, height: number) => void
    ) => void;
  }>(null);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => inner.current?.focus?.(),
      blur: () => inner.current?.blur?.(),
      measureInWindow: (callback) => inner.current?.measureInWindow?.(callback)
    }),
    []
  );
  return inner;
}

function Container(
  props: Contract.BoxProps & {
    variantGroup?: "variants";
    defaults?: Contract.BoxProps["sx"];
  },
  ref: ForwardedRef<UIElement>
) {
  const { children, defaults } = props;
  const { resolved, viewStyle, textStyle, nativeProps } = useStyled(props, {
    variantGroup: "variants",
    defaults
  });
  const ViewComponent = resolved.animated ? AnimatedView : AnyView;
  const PressableComponent = resolved.animated
    ? AnimatedPressable
    : AnyPressable;
  const inner = useElementRef(ref);
  const onPress = pressHandler(props);
  const content = textStyle ? (
    <InheritedTextStyle.Provider value={textStyle}>
      {children}
    </InheritedTextStyle.Provider>
  ) : (
    children
  );
  const style = { ...viewStyle };
  for (const textKey of Object.keys(textStyle ?? {})) delete style[textKey];
  if (onPress)
    return (
      <PressableComponent
        ref={inner}
        {...nativeProps}
        style={style}
        onPress={onPress}
      >
        {content}
      </PressableComponent>
    );
  return (
    <ViewComponent
      ref={inner}
      {...nativeProps}
      style={style}
      onLayout={(props as { onLayout?: unknown }).onLayout}
    >
      {content}
    </ViewComponent>
  );
}

export const Box = forwardRef<UIElement, Contract.BoxProps>(Container);
export const Flex = forwardRef<UIElement, Contract.FlexProps>(function Flex(
  props,
  ref
) {
  return Container({ ...props, defaults: { display: "flex" } }, ref);
});
export const Grid = forwardRef<UIElement, Contract.GridProps>(function Grid(
  props,
  ref
) {
  const { columns, children } = props;
  const [width, setWidth] = useState(0);
  const { resolved } = useStyled(props, { variantGroup: "variants" });
  const columnGap =
    (resolved.style.columnGap as number | undefined) ??
    (resolved.style.gap as number | undefined) ??
    0;
  const cellWidth =
    width > 0
      ? (width - columnGap * (columns - 1)) / columns
      : (`${100 / columns}%` as const);
  return Container(
    {
      ...props,
      defaults: { display: "flex", flexWrap: "wrap" },
      onLayout: (event: { nativeEvent: { layout: { width: number } } }) =>
        setWidth(event.nativeEvent.layout.width),
      children: Children.map(children, (child) => (
        <View style={{ width: cellWidth }}>{child}</View>
      ))
    } as Contract.BoxProps,
    ref
  );
});

export const Text = forwardRef<UIElement, Contract.TextProps>(function Text(
  props,
  ref
) {
  const { children, selectable, numberOfLines } = props;
  const inherited = useInheritedTextStyle();
  const { resolved, viewStyle, nativeProps } = useStyled(props, {
    variantGroup: "text",
    defaultVariant: "default"
  });
  const inner = useElementRef(ref);
  const onPress = pressHandler(props);
  const TextComponent = resolved.animated ? AnimatedText : AnyText;
  return (
    <TextComponent
      ref={inner}
      {...nativeProps}
      style={resolveLineHeight({ ...inherited, ...viewStyle })}
      numberOfLines={numberOfLines ?? resolved.numberOfLines}
      selectable={selectable ?? resolved.selectable}
      onPress={onPress}
    >
      {children}
    </TextComponent>
  );
});

export const Button = forwardRef<UIElement, Contract.ButtonProps>(
  function Button(props, ref) {
    const { children, disabled } = props;
    const { resolved, viewStyle, textStyle, nativeProps } = useStyled(props, {
      variantGroup: "buttons",
      defaultVariant: "primary",
      defaults: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    });
    const inner = useElementRef(ref);
    const onPress = pressHandler(props);
    const style = { ...viewStyle };
    for (const textKey of Object.keys(textStyle ?? {})) delete style[textKey];
    const ButtonComponent = resolved.animated
      ? AnimatedPressable
      : AnyPressable;
    return (
      <ButtonComponent
        ref={inner}
        {...nativeProps}
        focusable={nativeProps.focusable ?? true}
        accessibilityRole="button"
        disabled={disabled}
        style={style}
        onPress={disabled ? undefined : onPress}
      >
        <InheritedTextStyle.Provider value={textStyle}>
          {wrapChildren(children, textStyle)}
        </InheritedTextStyle.Provider>
      </ButtonComponent>
    );
  }
);

export const Label = forwardRef<UIElement, Contract.LabelProps>(function Label(
  props,
  ref
) {
  return Container(
    {
      ...props,
      variant: undefined,
      children: wrapChildren(props.children),
      defaults: { display: "flex", alignItems: "center" }
    },
    ref
  );
});

export const Link = forwardRef<UIElement, Contract.LinkProps>(function Link(
  props,
  ref
) {
  const { href, onPress, ...rest } = props;
  return (
    <Text
      ref={ref}
      {...rest}
      sx={{ color: "accent", textDecorationLine: "underline", ...props.sx }}
      onPress={(event) => {
        onPress?.(event);
        if (href) shell.openUrl(href);
      }}
    />
  );
});

export const Image = forwardRef<UIElement, Contract.ImageProps>(function Image(
  props,
  ref
) {
  const { viewStyle, nativeProps } = useStyled(props);
  const inner = useElementRef(ref);
  return (
    <NativeImage
      ref={inner as never}
      {...(nativeProps as object)}
      source={{ uri: props.src }}
      resizeMode={props.resizeMode}
      accessibilityLabel={props.alt}
      style={viewStyle as never}
    />
  );
});

function TextField(
  props: Contract.InputProps & { multiline?: boolean; rows?: number },
  ref: ForwardedRef<UIElement>,
  variant: "input" | "textarea"
) {
  const context = useThemeContext();
  const { viewStyle, nativeProps } = useStyled(props, {
    variantGroup: "forms",
    defaultVariant: variant
  });
  const inner = useElementRef(ref);
  const fields: Record<string, unknown> = { ...nativeProps };
  delete fields.focusable;
  return (
    <AnyInput
      ref={inner}
      {...fields}
      style={viewStyle}
      value={props.value}
      defaultValue={props.defaultValue}
      placeholder={props.placeholder}
      placeholderTextColor={context.colors["paragraph-secondary"]}
      editable={!props.disabled && !props.readOnly}
      autoFocus={props.autoFocus}
      maxLength={props.maxLength}
      secureTextEntry={props.type === "password"}
      selectTextOnFocus={props.selectTextOnFocus}
      multiline={props.multiline}
      numberOfLines={props.rows}
      onChangeText={props.onChangeText}
      onSubmitEditing={
        props.onSubmit
          ? (event: { nativeEvent: { text: string } }) =>
              props.onSubmit?.(event.nativeEvent.text)
          : undefined
      }
    />
  );
}

export const Input = forwardRef<UIElement, Contract.InputProps>(function Input(
  props,
  ref
) {
  return TextField(props, ref, "input");
});
export const Textarea = forwardRef<UIElement, Contract.TextareaProps>(
  function Textarea(props, ref) {
    return TextField({ ...props, multiline: true }, ref, "textarea");
  }
);

const CHECK_PATH = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

function Toggle(
  props: Contract.CheckboxProps & { radio?: boolean },
  ref: ForwardedRef<UIElement>
) {
  const { checked, onChange, disabled, radio } = props;
  const context = useThemeContext();
  const size = 18;
  return (
    <Box
      ref={ref}
      {...props}
      variant={undefined}
      onPress={(event) => {
        if (disabled) return;
        props.onPress?.(event);
        onChange?.(radio ? true : !checked);
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: radio ? 9 : "small",
        border: "1px solid",
        borderColor: checked ? "accent" : "icon",
        bg: checked && !radio ? "accent" : "transparent",
        opacity: disabled ? 0.5 : 1,
        ...props.sx
      }}
    >
      {checked && !radio ? (
        <Svg width={size - 4} height={size - 4} viewBox="0 0 24 24">
          <Path d={CHECK_PATH} fill={context.colors.accentForeground} />
        </Svg>
      ) : null}
      {checked && radio ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: context.colors.accent
          }}
        />
      ) : null}
    </Box>
  );
}

export const Checkbox = forwardRef<UIElement, Contract.CheckboxProps>(Toggle);
export const Radio = forwardRef<UIElement, Contract.RadioProps>(function Radio(
  props,
  ref
) {
  return Toggle({ ...props, radio: true }, ref);
});

export const Switch = forwardRef<UIElement, Contract.SwitchProps>(
  function Switch(props, ref) {
    const context = useThemeContext();
    const { nativeProps } = useStyled(props);
    const inner = useElementRef(ref);
    return (
      <NativeSwitch
        ref={inner as never}
        {...(nativeProps as object)}
        value={props.checked}
        disabled={props.disabled}
        onValueChange={props.onChange}
        trackColor={{
          false: context.colors.disabled,
          true: context.colors.accent
        }}
      />
    );
  }
);

export const Progress = forwardRef<UIElement, Contract.ProgressProps>(
  function Progress(props, ref) {
    const { value = 0, max = 100 } = props;
    const ratio = Math.max(0, Math.min(1, value / max));
    return (
      <Box
        ref={ref}
        {...props}
        sx={{
          height: 6,
          borderRadius: 3,
          bg: "background-secondary",
          overflow: "hidden",
          ...props.sx
        }}
      >
        <Box sx={{ height: "100%", width: `${ratio * 100}%`, bg: "accent" }} />
      </Box>
    );
  }
);

export const Slider = forwardRef<UIElement, Contract.SliderProps>(
  function Slider(props, ref) {
    const { value = 0, min = 0, max = 100, step = 1, onChange } = props;
    const width = useRef(0);
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const update = (x: number) => {
      if (!width.current || props.disabled) return;
      const raw =
        min + Math.max(0, Math.min(1, x / width.current)) * (max - min);
      onChange?.(Math.round(raw / step) * step);
    };
    return (
      <AnyView
        ref={ref}
        testID={props.testID}
        style={{ height: 20, justifyContent: "center", flexShrink: 1 }}
        onLayout={(event: { nativeEvent: { layout: { width: number } } }) => {
          width.current = event.nativeEvent.layout.width;
        }}
        onPointerDown={(event: { nativeEvent: { locationX: number } }) =>
          update(event.nativeEvent.locationX)
        }
        onPointerMove={(event: {
          nativeEvent: { locationX: number; buttons?: number };
        }) => {
          if (event.nativeEvent.buttons) update(event.nativeEvent.locationX);
        }}
      >
        <Progress value={ratio} max={1} />
      </AnyView>
    );
  }
);

export const Icon = forwardRef<UIElement, Contract.IconProps>(function Icon(
  props,
  _ref
) {
  const context = useThemeContext();
  const { nativeProps, viewStyle } = useStyled(props);
  const size = props.size ?? 24;
  const pixels =
    typeof size === "number"
      ? size
      : (context.theme.iconSizes as Record<string, number>)[size] ?? 24;
  const color = props.color
    ? context.colors[props.color] ?? props.color
    : context.colors.icon;
  const transform = props.rotate
    ? [{ rotate: `${props.rotate}deg` }]
    : undefined;
  return (
    <AnyView
      {...nativeProps}
      style={{ ...viewStyle, width: pixels, height: pixels, transform }}
    >
      {props.svg ? (
        <SvgXml xml={props.svg} width={pixels} height={pixels} color={color} />
      ) : (
        <Svg width={pixels} height={pixels} viewBox="0 0 24 24">
          <Path d={props.path} fill={color} />
        </Svg>
      )}
    </AnyView>
  );
});

export type { ReactNode };
