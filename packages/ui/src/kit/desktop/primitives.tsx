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
  ScrollView,
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
import type { SxProp } from "../contracts/style";
import {
  controlElement,
  elementFor,
  getElementById,
  registerElementId,
  type DesktopElement,
  type ElementControl
} from "./element";
import { htmlToText } from "./html-text";
import { setFormFields, type FormField } from "./form-data";
import { useThemeContext } from "./theme";
import { mergeSx, sxObject } from "../shared/style/shorthand";
import {
  changeEvent,
  clipboardEvent,
  syntheticEvent,
  type EventState,
  type NativeEvent
} from "./style/events";
import { pressHandler, testIdOf } from "./style/native-props";
import { resolveColor, resolveCssVars } from "./style/resolve";
import {
  InheritedTextStyle,
  SelectorScope,
  useInheritedTextStyle,
  useMergedTextStyle,
  useStyled,
  wrapChildren
} from "./style/use-styled";

const AnyView = View as any;
const AnyScrollView = ScrollView as any;

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

interface FormHandle {
  submit(): void;
  /** Adds a named field to the form's FormData; returns its removal. */
  register?(field: FormField): () => void;
}
const FormContext = createContext<FormHandle | undefined>(undefined);
/** The `sx.input` of the nearest element above that sets one. */
const InputSxContext = createContext<Contract.BoxProps["sx"] | undefined>(
  undefined
);

/** Puts a field with a `name` into its form's FormData. */
function useFormField(
  name: string | undefined,
  control: ElementControl,
  toggle: boolean
) {
  const form = useContext(FormContext);
  useEffect(() => {
    if (!name || !form?.register) return;
    return form.register({ name, control, toggle });
  }, [form, name, control, toggle]);
}
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
  if (typeof children === "string" || typeof children === "number") return true;
  return Array.isArray(children) && children.some(hasText);
}

const SCROLL_CONTENT_KEYS =
  /^(?:flexDirection|flexWrap|justifyContent|alignItems|alignContent|gap|rowGap|columnGap|padding(?:Top|Right|Bottom|Left)?)$/;

function Container(
  props: Contract.BoxProps & {
    variantGroup?: "variants";
    defaults?: SxProp;
    /** Puts the box's contents inside a provider, after its text is drawn. */
    around?: (contents: ReactNode) => ReactNode;
  },
  ref: ForwardedRef<UIElement>
) {
  const { children, defaults, around } = props;
  const { resolved, viewStyle, textStyle, nativeProps } = useStyled(props, {
    variantGroup: "variants",
    defaults,
    tag: "div"
  });
  const ViewComponent = resolved.animated ? AnimatedView : AnyView;
  const PressableComponent = resolved.animated
    ? AnimatedPressable
    : AnyPressable;
  const [setRef, element] = useElementRef(ref, { id: props.id });
  const clicks = useRef({ last: 0 });
  const onPress = pressHandler(props, clicks.current);
  const mergedTextStyle = useMergedTextStyle(textStyle);
  // `element.click()` runs the handler, as it does in the DOM.
  const press = useRef(onPress);
  press.current = onPress;
  useEffect(() => {
    const current = element.current;
    if (!current) return;
    current.clickHandler = () =>
      press.current?.({ target: current.node, currentTarget: current.node });
    return () => {
      current.clickHandler = undefined;
    };
  }, [element]);

  // A form is whatever handles `onSubmit`: its submit buttons and the Enter
  // key in its inputs raise the event.
  const isForm = props.as === "form" || !!props.onSubmit;
  const onSubmit = useRef(props.onSubmit);
  onSubmit.current = props.onSubmit;
  const fields = useRef(new Set<FormField>());
  const form = useMemo<FormHandle | undefined>(
    () =>
      isForm
        ? {
            submit: () => {
              if (element.current)
                setFormFields(element.current, fields.current);
              onSubmit.current?.(
                syntheticEvent("submit", undefined, element.current)
              );
            },
            register: (field) => {
              fields.current.add(field);
              return () => fields.current.delete(field);
            }
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
  let content: ReactNode = textStyle ? (
    <InheritedTextStyle.Provider value={mergedTextStyle}>
      {text}
    </InheritedTextStyle.Provider>
  ) : (
    text
  );
  if (around) content = around(content);
  if (form)
    content = (
      <FormContext.Provider value={form}>{content}</FormContext.Provider>
    );
  // A function-form `sx` is theme-ui's; the nested `input` key is the kit's.
  const inputSx = typeof props.sx === "function" ? undefined : props.sx?.input;
  if (inputSx)
    content = (
      <InputSxContext.Provider value={inputSx}>
        {content}
      </InputSxContext.Provider>
    );
  if (resolved.rules)
    content = <SelectorScope rules={resolved.rules}>{content}</SelectorScope>;
  const style = { ...viewStyle };
  for (const textKey of Object.keys(textStyle ?? {})) delete style[textKey];
  // Pressable things show the hand cursor unless the style says otherwise.
  if (onPress && style.cursor === undefined) style.cursor = "pointer";
  if (resolved.scrolls) {
    // `overflow: scroll` scrolls, as a DOM box does. The box's own layout of
    // its children (direction, alignment, gap, padding) is the scrolled
    // content's; flexGrow keeps the content at least as large as the box.
    const content_: Record<string, unknown> = { flexGrow: 1 };
    for (const key of Object.keys(style))
      if (SCROLL_CONTENT_KEYS.test(key)) {
        content_[key] = style[key];
        delete style[key];
      }
    return (
      <AnyScrollView
        ref={setRef}
        {...nativeProps}
        horizontal={resolved.scrolls === "x"}
        scrollEventThrottle={16}
        style={style}
        contentContainerStyle={content_}
      >
        {content}
      </AnyScrollView>
    );
  }
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
  // Equal columns are drawn; theme-ui's other forms lay out as one column.
  const columns =
    typeof props.columns === "number" && props.columns > 0 ? props.columns : 1;
  const { children } = props;
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
  const { selectable, href, dangerouslySetInnerHTML } = props;
  const inherited = useInheritedTextStyle();
  const { resolved, viewStyle, nativeProps } = useStyled(props, {
    variantGroup: "text",
    defaultVariant: "default",
    tag: "span"
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
  const content = dangerouslySetInnerHTML
    ? htmlToText(dangerouslySetInnerHTML.__html)
    : hasLineBreak(props.children)
    ? withLineBreaks(props.children)
    : props.children;
  return (
    <TextComponent
      ref={setRef}
      {...nativeProps}
      style={resolveLineHeight({
        ...inherited,
        ...(onPress ? { cursor: "pointer" } : {}),
        ...viewStyle
      })}
      numberOfLines={resolved.numberOfLines}
      selectable={
        selectable ??
        resolved.selectable ??
        selectableFromClass(props.className)
      }
      onPress={onPress}
    >
      {resolved.rules ? (
        <SelectorScope rules={resolved.rules}>{content}</SelectorScope>
      ) : (
        content
      )}
    </TextComponent>
  );
});

export const Button = forwardRef<UIElement, Contract.ButtonProps>(
  function Button(props, ref) {
    const { children, disabled } = props;
    const { resolved, viewStyle, textStyle, nativeProps } = useStyled(props, {
      variantGroup: "buttons",
      defaultVariant: "primary",
      tag: "button",
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
    !props.onClick && (!!htmlFor || !!control);
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
      // The label's text takes the label's own colour and size, so the
      // provider goes around the contents the box has already drawn.
      around: (contents) => (
        <LabelContext.Provider value={registry}>
          {contents}
        </LabelContext.Provider>
      ),
      defaults: {
        display: "flex",
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
      sx={mergeSx(
        { color: "accent", textDecorationLine: "underline" },
        props.sx
      )}
    />
  );
});

const RESIZE_MODES = { cover: "cover", contain: "contain", fill: "stretch" };

const SVG_DATA_URI = /^data:image\/svg\+xml(;charset=[\w-]+)?(;base64)?,/i;

/** The SVG document `src` holds (as text or a data URI), or undefined. */
export function svgSource(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const text = src.trimStart();
  if (text.startsWith("<svg") || text.startsWith("<?xml")) return text;
  const match = SVG_DATA_URI.exec(text);
  if (!match) return undefined;
  const data = text.slice(match[0].length);
  try {
    return match[2] ? globalThis.atob(data) : decodeURIComponent(data);
  } catch {
    return undefined;
  }
}

/** The size an SVG document declares: width and height, else its viewBox. */
export function svgIntrinsicSize(svg: string) {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? "";
  const attribute = (name: string) =>
    parseFloat(new RegExp(`\\s${name}="([\\d.]+)(?:px)?"`).exec(root)?.[1] ?? "");
  const box = /\sviewBox="([^"]+)"/.exec(root)?.[1].trim().split(/[\s,]+/);
  const width = attribute("width") || parseFloat(box?.[2] ?? "") || 24;
  const height = attribute("height") || parseFloat(box?.[3] ?? "") || width;
  return { width, height };
}

function pixelsOf(value: unknown): number | undefined {
  return typeof value === "number" && value > 0 ? value : undefined;
}

export const Image = forwardRef<UIElement, Contract.ImageProps>(function Image(
  props,
  ref
) {
  const { resolved, viewStyle, nativeProps } = useStyled(props, { tag: "img" });
  const [setRef, element] = useElementRef(ref, { id: props.id });
  const { colors } = useThemeContext();
  const { onLoad } = props;
  const svg = svgSource(props.src);
  if (svg) {
    // An SVG document is drawn as vectors, at the size the style gives or,
    // as an <img> does, at the size the document declares.
    const intrinsic = svgIntrinsicSize(svg);
    const width = pixelsOf(viewStyle.width);
    const height = pixelsOf(viewStyle.height);
    const ratio = intrinsic.width / intrinsic.height || 1;
    const drawWidth = width ?? (height ? height * ratio : intrinsic.width);
    const drawHeight = height ?? drawWidth / ratio;
    return (
      <AnyView
        ref={setRef}
        {...nativeProps}
        accessibilityLabel={props.alt}
        style={{ ...viewStyle, width: drawWidth, height: drawHeight }}
      >
        <SvgXml
          xml={resolveCssVars(svg, colors)}
          width={drawWidth}
          height={drawHeight}
        />
      </AnyView>
    );
  }
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
        resolved.objectFit
          ? (RESIZE_MODES[resolved.objectFit] as "cover")
          : undefined
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
  const inputSx = useContext(InputSxContext);
  const { viewStyle, nativeProps } = useStyled(
    inputSx
      ? {
          ...props,
          sx: {
            ...sxObject(props.sx, context.theme),
            ...sxObject(inputSx, context.theme)
          }
        }
      : props,
    {
      variantGroup: "forms",
      defaultVariant: props.field,
      defaults: { p: 2 },
      tag: props.field
    }
  );
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
  useFormField(props.name, control, false);
  const form = useContext(FormContext);
  const { onChange, onPaste } = props;

  const fields: Record<string, unknown> = { ...nativeProps };
  delete fields.focusable;
  // The focus reporting every focusable element gets is left off the native
  // text field: with focus handlers it did not ask for, the field stopped
  // getting Enter in the pdf search (pdf-preview.e2e).
  if (!props.onFocus) delete fields.onFocus;
  if (!props.onBlur) delete fields.onBlur;
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
        // The native host's ref can still be empty on the first change, so
        // the change names the field's control: `target.value` is the text.
        onChange?.(
          changeEvent(element.current ?? controlElement(control), event)
        );
      }}
      onPaste={
        onPaste
          ? (event: NativeEvent) =>
              onPaste(
                clipboardEvent(element.current ?? controlElement(control), event)
              )
          : undefined
      }
      onSelectionChange={(event: NativeEvent) => {
        const selection = event?.nativeEvent?.selection;
        if (!selection) return;
        control.selectionStart = selection.start;
        control.selectionEnd = selection.end;
      }}
      onSubmitEditing={
        form && !props.multiline
          ? () => form.submit()
          : undefined
      }
    />
  );
});

/**
 * The picker of a colour input, as web's `<input type="color">` gives it: its
 * `ref`, `value` and `onChange`. A write to `ref.current.value` redraws it.
 */
export function useColorField(
  props: Contract.InputProps,
  ref: ForwardedRef<UIInputElement>
) {
  const [own, setOwn] = useState(String(props.defaultValue ?? "#000000"));
  const value = props.value === undefined ? own : String(props.value);
  const control = useControl();
  control.value = value;
  control.setValue = (text) => {
    if (props.value === undefined) setOwn(text);
  };
  const [setRef, element] = useControlRef(ref, control);
  return {
    ref: setRef,
    "data-test-id": testIdOf(props),
    sx: props.sx,
    value,
    onChange: (color: string) => {
      control.value = color;
      if (props.value === undefined) setOwn(color);
      props.onChange?.(changeEvent(element.current));
    }
  };
}

const ColorField = forwardRef<UIInputElement, Contract.InputProps>(
  function ColorField(props, ref) {
    // Required when drawn: the colour picker is built from these primitives.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ColorPicker } = require("./color-picker") as {
      ColorPicker: typeof Contract.ColorPicker;
    };
    return <ColorPicker {...useColorField(props, ref)} />;
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
  useFormField(props.name, control, true);
  const size = 18;
  return (
    <Box
      {...(props as unknown as Contract.BoxProps)}
      ref={setRef}
      variant={undefined}
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
    const { min = 0, max = 100, step = 1, onChange } = props;
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
  // An icon's `.path` can hold a whole SVG document (anything starting with `<`).
  const svgDocument =
    props.svg ??
    (props.path?.trimStart().startsWith("<") ? props.path : undefined);
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
      {svgDocument ? (
        <SvgXml
          xml={svgDocument}
          width={pixels}
          height={pixels}
          color={color}
        />
      ) : (
        <Svg width={pixels} height={pixels} viewBox="0 0 24 24">
          <Path d={props.path} fill={color} />
        </Svg>
      )}
    </IconView>
  );
});

export type { ReactNode };

export { FormData } from "./form-data";
