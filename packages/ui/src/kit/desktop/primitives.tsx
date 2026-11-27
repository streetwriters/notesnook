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
  createContext,
  forwardRef,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactNode,
  type RefObject
} from "react";
import {
  Image as NativeImage,
  Pressable,
  Text as NativeText,
  TextInput,
  View
} from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Circle, Path, SvgXml } from "react-native-svg";
import { shell } from "@platform";
import type * as Contract from "../contracts/primitives";
import type {
  UIElement,
  UIInputElement,
  UITextAreaElement
} from "../contracts/elements";
import type { UIMouseEvent } from "../contracts/events";
import {
  elementFor,
  getElementById,
  registerElementId,
  type DesktopElement,
  type ElementControl
} from "./element";
import { htmlToText } from "./html-text";
import { useThemeContext } from "./theme";
import {
  changeEvent,
  syntheticEvent,
  type EventState,
  type NativeEvent
} from "./style/events";
import { pressHandler, testIdOf } from "./style/native-props";
import { resolveColor } from "./style/resolve";
import {
  InheritedTextStyle,
  useInheritedTextStyle,
  useMergedTextStyle,
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

function assignRef<T>(ref: ForwardedRef<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function wasPrevented(event: unknown) {
  return !!(event as Partial<EventState> | undefined)?.defaultPrevented;
}

/**
 * The ref to give the host component. It hands the caller's ref the node's
 * `UIElement`, and keeps it for the component's own handlers.
 */
function useElementRef(
  ref: ForwardedRef<any>,
  options: { control?: ElementControl; id?: string } = {}
) {
  const { control, id } = options;
  const current = useRef<DesktopElement | null>(null);
  const release = useRef<(() => void) | undefined>(undefined);
  const set = useCallback(
    (node: unknown) => {
      release.current?.();
      release.current = undefined;
      const element = elementFor(node, control);
      current.current = element;
      if (element && id) release.current = registerElementId(id, element);
      assignRef(ref, element);
    },
    [ref, control, id]
  );
  return [set, current] as const;
}

/** As `useElementRef`, for a control drawn with another kit element. */
function useControlRef(ref: ForwardedRef<any>, control: ElementControl) {
  const current = useRef<DesktopElement | null>(null);
  const set = useCallback(
    (element: UIElement | null) => {
      current.current = elementFor(element, control);
      assignRef(ref, current.current);
    },
    [ref, control]
  );
  return [set, current] as const;
}

function useControl(): ElementControl {
  const control = useRef<ElementControl | null>(null);
  return (control.current ??= {});
}

const FormContext = createContext<{ submit(): void } | undefined>(undefined);
/** Forms with an `id`, for buttons outside them that name it in `form`. */
const formsById = new Map<string, { submit(): void }>();

interface LabelRegistry {
  register(control: ElementControl): () => void;
}
const LabelContext = createContext<LabelRegistry | undefined>(undefined);

/** Lets the label around a control activate it, as a `<label>` does. */
function useLabelControl(control: ElementControl) {
  const label = useContext(LabelContext);
  useEffect(() => label?.register(control), [label, control]);
}

/** Whether `children` holds a `<br />`, directly or in a fragment. */
function hasLineBreak(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (found || !isValidElement(child)) return;
    if (child.type === "br") found = true;
    else if (child.type === Fragment)
      found = hasLineBreak((child.props as { children?: ReactNode }).children);
  });
  return found;
}

/** Text children with each `<br />` drawn as a line break, as in HTML. */
function withLineBreaks(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "br") result.push("\n");
    else if (isValidElement(child) && child.type === Fragment)
      result.push(
        ...withLineBreaks((child.props as { children?: ReactNode }).children)
      );
    else result.push(child);
  });
  return result;
}

function hasText(children: ReactNode): boolean {
  if (typeof children === "string" || typeof children === "number")
    return true;
  return Array.isArray(children) && children.some(hasText);
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
  const [setRef, element] = useElementRef(ref, { id: props.id });
  const clicks = useRef({ last: 0 });
  const onPress = pressHandler(props, clicks.current);
  const mergedTextStyle = useMergedTextStyle(textStyle);

  // A form is whatever handles `onSubmit`: its submit buttons and the Enter
  // key in its inputs raise the event.
  const isForm = props.as === "form" || !!props.onSubmit;
  const onSubmit = useRef(props.onSubmit);
  onSubmit.current = props.onSubmit;
  const form = useMemo(
    () =>
      isForm
        ? {
            submit: () =>
              onSubmit.current?.(
                syntheticEvent("submit", undefined, element.current)
              )
          }
        : undefined,
    [isForm, element]
  );
  useEffect(() => {
    if (!form || !props.id) return;
    const id = props.id;
    formsById.set(id, form);
    return () => {
      if (formsById.get(id) === form) formsById.delete(id);
    };
  }, [form, props.id]);

  // Text written straight into a box, as HTML allows, is drawn as text.
  const text = hasText(children)
    ? wrapChildren(children, mergedTextStyle)
    : children;
  let content = textStyle ? (
    <InheritedTextStyle.Provider value={mergedTextStyle}>
      {text}
    </InheritedTextStyle.Provider>
  ) : (
    text
  );
  if (form)
    content = (
      <FormContext.Provider value={form}>{content}</FormContext.Provider>
    );
  const style = { ...viewStyle };
  for (const textKey of Object.keys(textStyle ?? {})) delete style[textKey];
  // Pressable things show the hand cursor unless the style says otherwise.
  if (onPress && style.cursor === undefined) style.cursor = "pointer";
  if (onPress)
    return (
      <PressableComponent
        ref={setRef}
        {...nativeProps}
        style={style}
        onPress={onPress}
      >
        {content}
      </PressableComponent>
    );
  return (
    <ViewComponent
      ref={setRef}
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

/** Web marks text selectable with `className="selectable"`; desktop reads it too. */
function selectableFromClass(className: string | undefined): true | undefined {
  return className?.split(/\s+/).includes("selectable") ? true : undefined;
}

export const Text = forwardRef<UIElement, Contract.TextProps>(function Text(
  props,
  ref
) {
  const { selectable, numberOfLines, href, dangerouslySetInnerHTML } = props;
  const inherited = useInheritedTextStyle();
  const { resolved, viewStyle, nativeProps } = useStyled(props, {
    variantGroup: "text",
    defaultVariant: "default"
  });
  const [setRef] = useElementRef(ref, { id: props.id });
  const clicks = useRef({ last: 0 });
  const onPress = pressHandler(
    href
      ? {
          ...props,
          onClick: (event: UIMouseEvent) => {
            props.onClick?.(event);
            if (!wasPrevented(event)) shell.openUrl(href);
          }
        }
      : props,
    clicks.current
  );
  const TextComponent = resolved.animated ? AnimatedText : AnyText;
  return (
    <TextComponent
      ref={setRef}
      {...nativeProps}
      style={resolveLineHeight({
        ...inherited,
        ...(onPress ? { cursor: "pointer" } : {}),
        ...viewStyle
      })}
      numberOfLines={numberOfLines ?? resolved.numberOfLines}
      selectable={
        selectable ??
        resolved.selectable ??
        selectableFromClass(props.className)
      }
      onPress={onPress}
    >
      {dangerouslySetInnerHTML
        ? htmlToText(dangerouslySetInnerHTML.__html)
        : hasLineBreak(props.children)
          ? withLineBreaks(props.children)
          : props.children}
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
    const [setRef, element] = useElementRef(ref, { id: props.id });
    const mergedTextStyle = useMergedTextStyle(textStyle);
    const parentForm = useContext(FormContext);
    // As in HTML, a button submits its form, or the form its `form` names,
    // unless its type says otherwise.
    const form = props.form
      ? { submit: () => formsById.get(props.form!)?.submit() }
      : parentForm;
    const submits = !!form && props.type !== "button" && props.type !== "reset";
    useEffect(() => {
      if (props.autoFocus) element.current?.focus();
      // Only on mount, as the attribute does on the web.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const clicks = useRef({ last: 0 });
    const onPress = pressHandler(
      submits
        ? {
            ...props,
            onClick: (event: UIMouseEvent) => {
              props.onClick?.(event);
              if (!wasPrevented(event)) form.submit();
            }
          }
        : props,
      clicks.current
    );
    const style = { ...viewStyle };
    for (const textKey of Object.keys(textStyle ?? {})) delete style[textKey];
    if (style.cursor === undefined)
      style.cursor = disabled ? "default" : "pointer";
    const ButtonComponent = resolved.animated
      ? AnimatedPressable
      : AnyPressable;
    return (
      <ButtonComponent
        ref={setRef}
        {...nativeProps}
        focusable={props.focusable ?? nativeProps.focusable ?? true}
        accessibilityRole="button"
        disabled={disabled}
        style={style}
        onPress={disabled ? undefined : onPress}
      >
        <InheritedTextStyle.Provider value={mergedTextStyle}>
          {wrapChildren(children, mergedTextStyle)}
        </InheritedTextStyle.Provider>
      </ButtonComponent>
    );
  }
);

export const Label = forwardRef<UIElement, Contract.LabelProps>(function Label(
  props,
  ref
) {
  const { htmlFor } = props;
  const [control, setControl] = useState<ElementControl | null>(null);
  const registry = useMemo<LabelRegistry>(
    () => ({
      register(next) {
        // The first control in a label is the labelled one.
        setControl((current) => current ?? next);
        return () =>
          setControl((current) => (current === next ? null : current));
      }
    }),
    []
  );
  // A label with its own click handler keeps deciding what a click does.
  const activates =
    !props.onClick && !props.onPress && (!!htmlFor || !!control);
  return Container(
    {
      ...props,
      variant: undefined,
      onClick: activates
        ? () => {
            const target = htmlFor ? getElementById(htmlFor) : null;
            if (target) target.click();
            else control?.click?.();
          }
        : props.onClick,
      children: (
        <LabelContext.Provider value={registry}>
          {wrapChildren(props.children)}
        </LabelContext.Provider>
      ),
      defaults: {
        display: "flex",
        alignItems: "center",
        ...(activates ? { cursor: "default" } : null)
      }
    },
    ref
  );
});

export const Link = forwardRef<UIElement, Contract.LinkProps>(function Link(
  props,
  ref
) {
  return (
    <Text
      ref={ref}
      {...(props as Contract.TextProps)}
      sx={{ color: "accent", textDecorationLine: "underline", ...props.sx }}
    />
  );
});

const RESIZE_MODES = { cover: "cover", contain: "contain", fill: "stretch" };

export const Image = forwardRef<UIElement, Contract.ImageProps>(function Image(
  props,
  ref
) {
  const { resolved, viewStyle, nativeProps } = useStyled(props);
  const [setRef, element] = useElementRef(ref, { id: props.id });
  const { onLoad } = props;
  return (
    <NativeImage
      ref={setRef as never}
      {...(nativeProps as object)}
      source={{ uri: props.src }}
      onLoad={
        onLoad
          ? (((event: NativeEvent) =>
              onLoad(syntheticEvent("load", event, element.current))) as never)
          : undefined
      }
      resizeMode={
        props.resizeMode ??
        (resolved.objectFit
          ? (RESIZE_MODES[resolved.objectFit] as "cover")
          : undefined)
      }
      accessibilityLabel={props.alt}
      style={viewStyle as never}
    />
  );
});

type TextFieldProps = Contract.InputProps & {
  multiline?: boolean;
  rows?: number;
  field: "input" | "textarea";
};

const TextField = forwardRef<UIInputElement, TextFieldProps>(function TextField(
  props,
  ref
) {
  const context = useThemeContext();
  const { viewStyle, nativeProps } = useStyled(props, {
    variantGroup: "forms",
    defaultVariant: props.field,
    defaults: { p: 2 }
  });
  // A DOM input has an intrinsic width; a native text field with `width:
  // "auto"` and no text would size to nothing and could not be clicked.
  if (viewStyle.width === "auto" && viewStyle.minWidth === undefined)
    (viewStyle as Record<string, unknown>).minWidth = 136;
  const control = useControl();
  if (props.value !== undefined) control.value = String(props.value);
  else if (control.value === undefined)
    control.value = String(props.defaultValue ?? "");
  const [setRef, element] = useElementRef(ref, { control, id: props.id });
  control.setValue = (text) => element.current?.node.setNativeProps?.({ text });
  control.setSelection = (start, end) =>
    element.current?.node.setNativeProps?.({ selection: { start, end } });
  control.click = () => element.current?.focus();
  useLabelControl(control);
  const form = useContext(FormContext);
  const { onChange, onChangeText, onSubmitEditing } = props;

  const fields: Record<string, unknown> = { ...nativeProps };
  delete fields.focusable;
  return (
    <AnyInput
      ref={setRef}
      {...fields}
      style={{
        cursor: props.disabled ? "default" : "text",
        ...viewStyle
      }}
      value={props.value === undefined ? undefined : String(props.value)}
      defaultValue={
        props.defaultValue === undefined
          ? undefined
          : String(props.defaultValue)
      }
      placeholder={props.placeholder}
      placeholderTextColor={context.colors["paragraph-secondary"]}
      editable={!props.disabled && !props.readOnly}
      autoFocus={props.autoFocus}
      maxLength={props.maxLength}
      secureTextEntry={props.type === "password"}
      selectTextOnFocus={props.selectTextOnFocus}
      multiline={props.multiline}
      numberOfLines={props.rows}
      onChange={(event: NativeEvent) => {
        const text = String(event?.nativeEvent?.text ?? "");
        control.value = text;
        onChangeText?.(text);
        onChange?.(changeEvent(element.current, event));
      }}
      onSelectionChange={(event: NativeEvent) => {
        const selection = event?.nativeEvent?.selection;
        if (!selection) return;
        control.selectionStart = selection.start;
        control.selectionEnd = selection.end;
      }}
      onSubmitEditing={
        onSubmitEditing || (form && !props.multiline)
          ? (event: NativeEvent) => {
              onSubmitEditing?.(String(event?.nativeEvent?.text ?? ""));
              if (!props.multiline) form?.submit();
            }
          : undefined
      }
    />
  );
});

const ColorField = forwardRef<UIInputElement, Contract.InputProps>(
  function ColorField(props, ref) {
    const [own, setOwn] = useState(String(props.defaultValue ?? "#000000"));
    const value = props.value === undefined ? own : String(props.value);
    const control = useControl();
    control.value = value;
    const [setRef, element] = useControlRef(ref, control);
    // Required when drawn: the colour picker is built from these primitives.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ColorPicker } = require("./color-picker") as {
      ColorPicker: typeof Contract.ColorPicker;
    };
    return (
      <ColorPicker
        ref={setRef}
        data-test-id={testIdOf(props)}
        testID={testIdOf(props)}
        sx={props.sx}
        value={value}
        onChange={(color) => {
          control.value = color;
          if (props.value === undefined) setOwn(color);
          props.onChangeText?.(color);
          props.onChange?.(changeEvent(element.current));
        }}
      />
    );
  }
);

export const Input = forwardRef<UIInputElement, Contract.InputProps>(
  function Input(props, ref) {
    switch (props.type) {
      case "hidden":
        return null;
      case "checkbox":
        return (
          <Checkbox
            ref={ref}
            {...(props as unknown as Contract.CheckboxProps)}
          />
        );
      case "radio":
        return (
          <Radio ref={ref} {...(props as unknown as Contract.RadioProps)} />
        );
      case "color":
        return <ColorField ref={ref} {...props} />;
      default:
        return <TextField ref={ref} {...props} field="input" />;
    }
  }
);
export const Textarea = forwardRef<UITextAreaElement, Contract.TextareaProps>(
  function Textarea(props, ref) {
    return (
      <TextField
        ref={ref as ForwardedRef<UIInputElement>}
        {...(props as unknown as Contract.InputProps)}
        multiline
        field="textarea"
      />
    );
  }
);

const CHECK_PATH = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

/**
 * The checked state of a toggle: the `checked` prop when it is given,
 * otherwise the toggle's own, starting at `defaultChecked`.
 */
function useChecked(
  props: {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (event: any) => void;
    onCheckedChange?: (checked: boolean) => void;
  },
  control: ElementControl,
  element: RefObject<DesktopElement | null>,
  next: (checked: boolean) => boolean
) {
  const [own, setOwn] = useState(!!props.defaultChecked);
  const checked = props.checked ?? own;
  control.checked = checked;
  control.setChecked = (value) => {
    if (props.checked === undefined) setOwn(value);
  };
  const toggle = (event?: NativeEvent) => {
    const value = next(checked);
    control.checked = value;
    if (props.checked === undefined) setOwn(value);
    props.onCheckedChange?.(value);
    if (value !== checked)
      props.onChange?.(changeEvent(element.current, event));
  };
  return [checked, toggle] as const;
}

const Toggle = forwardRef<
  UIInputElement,
  Contract.CheckboxProps & { radio?: boolean; value?: string }
>(function Toggle(props, ref) {
  const { disabled, radio } = props;
  const context = useThemeContext();
  const control = useControl();
  control.value = props.value ?? "on";
  const [setRef, element] = useControlRef(ref, control);
  const [checked, toggle] = useChecked(props, control, element, (current) =>
    radio ? true : !current
  );
  control.click = () => {
    if (!disabled) toggle();
  };
  useLabelControl(control);
  const size = 18;
  return (
    <Box
      {...(props as unknown as Contract.BoxProps)}
      ref={setRef}
      variant={undefined}
      onPress={disabled ? undefined : props.onPress}
      onClick={(event) => {
        if (disabled) return;
        (props.onClick as Contract.BoxProps["onClick"])?.(event);
        toggle();
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
});

export const Checkbox = forwardRef<UIInputElement, Contract.CheckboxProps>(
  function Checkbox(props, ref) {
    return <Toggle ref={ref} {...props} />;
  }
);
export const Radio = forwardRef<UIInputElement, Contract.RadioProps>(
  function Radio(props, ref) {
    return <Toggle ref={ref} {...props} radio />;
  }
);

export const Switch = forwardRef<UIInputElement, Contract.SwitchProps>(
  function Switch(props, ref) {
    const context = useThemeContext();
    const { viewStyle, nativeProps } = useStyled(props);
    const control = useControl();
    const [setRef, element] = useElementRef(ref, { control, id: props.id });
    const [checked, toggle] = useChecked(
      props,
      control,
      element,
      (current) => !current
    );
    control.click = () => {
      if (!props.disabled) toggle();
    };
    useLabelControl(control);
    const onClick = pressHandler({ onClick: props.onClick });
    const background =
      (viewStyle as { backgroundColor?: string } | undefined)
        ?.backgroundColor ??
      (checked ? context.colors.accent : context.colors["icon-disabled"]);
    return (
      <Pressable
        ref={setRef as never}
        {...(nativeProps as object)}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled: !!props.disabled }}
        disabled={props.disabled}
        onPress={(event) => {
          event.stopPropagation();
          onClick?.(event as NativeEvent);
          toggle(event as NativeEvent);
        }}
        style={[
          viewStyle as object,
          {
            width: 34,
            height: 18,
            borderRadius: 18,
            backgroundColor: "transparent",
            opacity: props.disabled ? 0.5 : 1
          }
        ]}
      >
        <View
          testID="switch-track"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 34,
            height: 18,
            borderRadius: 18,
            backgroundColor: background
          }}
        />
        <View
          testID="switch-thumb"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 4,
            left: checked ? 20 : 4,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#ffffff"
          }}
        />
      </Pressable>
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

export const Donut = forwardRef<UIElement, Contract.DonutProps>(function Donut(
  props,
  ref
) {
  const { value, min = 0, max = 1, size = 128, strokeWidth = 2 } = props;
  const context = useThemeContext();
  const { viewStyle, nativeProps } = useStyled(props);
  const [setRef] = useElementRef(ref, { id: props.id });
  const radius = 16 - strokeWidth;
  const circumference = 2 * radius * Math.PI;
  const ratio =
    max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const color =
    (viewStyle.color as string | undefined) ?? context.colors.accent;
  const style = { ...viewStyle };
  delete style.color;
  return (
    <AnyView
      ref={setRef}
      {...nativeProps}
      accessibilityRole="progressbar"
      accessibilityValue={{ min, max, now: value }}
      style={{ ...style, width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle
          cx={16}
          cy={16}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={1 / 8}
        />
        <Circle
          cx={16}
          cy={16}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={circumference - ratio * circumference}
          transform="rotate(-90 16 16)"
        />
      </Svg>
    </AnyView>
  );
});

export const Slider = forwardRef<UIInputElement, Contract.SliderProps>(
  function Slider(props, ref) {
    const { min = 0, max = 100, step = 1, onValueChange, onChange } = props;
    const [own, setOwn] = useState(props.defaultValue ?? min);
    const value = props.value ?? own;
    const control = useControl();
    control.value = String(value);
    const [setRef, element] = useElementRef(ref, { control, id: props.id });
    const width = useRef(0);
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const update = (x: number) => {
      if (!width.current || props.disabled) return;
      const raw =
        min + Math.max(0, Math.min(1, x / width.current)) * (max - min);
      const next = Math.round(raw / step) * step;
      control.value = String(next);
      if (props.value === undefined) setOwn(next);
      onValueChange?.(next);
      onChange?.(changeEvent(element.current));
    };
    return (
      <AnyView
        ref={setRef}
        testID={testIdOf(props)}
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

const PERCENT_TRANSLATE = /translate([XY]?)\((-?\d*\.?\d+)%\)/g;

/**
 * A CSS transform with each percentage translate (of the element's own
 * size, as on the web) turned into pixels, which is all desktop can draw.
 */
export function resolvePercentTranslate(
  transform: unknown,
  width: number,
  height: number
) {
  if (typeof transform !== "string" || !transform.includes("%"))
    return transform;
  return transform.replace(PERCENT_TRANSLATE, (_, axis: string, amount) => {
    const ratio = parseFloat(amount) / 100;
    if (axis === "X") return `translateX(${ratio * width}px)`;
    if (axis === "Y") return `translateY(${ratio * height}px)`;
    return `translate(${ratio * width}px, ${ratio * height}px)`;
  });
}

export const Icon = forwardRef<UIElement, Contract.IconProps>(function Icon(
  props,
  ref
) {
  const context = useThemeContext();
  const { resolved, nativeProps, viewStyle } = useStyled(props);
  const [setRef] = useElementRef(ref, { id: props.id });
  const IconView = resolved.animated ? AnimatedView : AnyView;
  const size = props.size ?? 24;
  const svg = props.svg ?? (isSvgDocument(props.path) ? props.path : undefined);
  const pixels =
    typeof size === "number"
      ? size
      : (context.theme.iconSizes as Record<string, number>)[size] ?? 24;
  const color = props.color
    ? resolveColor(props.color, context.colors)
    : context.colors.icon;
  const own = resolvePercentTranslate(viewStyle.transform, pixels, pixels);
  const transform = props.rotate
    ? typeof own === "string"
      ? `${own} rotate(${props.rotate}deg)`
      : [...((own as any[]) ?? []), { rotate: `${props.rotate}deg` }]
    : own;
  return (
    <IconView
      ref={setRef}
      {...nativeProps}
      style={{
        ...viewStyle,
        width: pixels,
        height: pixels,
        ...(transform ? { transform } : null)
      }}
    >
      {svg ? (
        <SvgXml xml={svg} width={pixels} height={pixels} color={color} />
      ) : (
        <Svg width={pixels} height={pixels} viewBox="0 0 24 24">
          <Path d={props.path} fill={color} />
        </Svg>
      )}
    </IconView>
  );
});

/** Whether an icon `path` holds a whole SVG document rather than a `d`. */
function isSvgDocument(path: string | undefined): path is string {
  return !!path && path.trimStart().startsWith("<");
}

export type { ReactNode };
