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

// Stand-ins for what the desktop kit's components are built on, for unit
// tests that render them with `./render`. Each is the smallest thing that
// keeps the props a component passes down, so a test can read them and call
// the handlers. A test file mocks the modules it needs with these factories:
//
//   vi.mock("react-native", async () => (await import("./testing/mocks")).reactNative());

import {
  createElement,
  forwardRef,
  Fragment,
  useImperativeHandle,
  type ReactNode
} from "react";

type AnyProps = Record<string, any>;

/** What the mocks recorded and what they answer with; reset between tests. */
export const state = {
  /** Calls to the native scroll view's `scrollTo`. */
  scrollTo: [] as { x?: number; y?: number; animated?: boolean }[],
  /** Handlers registered with `keyboard.register`, newest last. */
  keys: [] as { keys: string[]; handler: (event: any) => void }[],
  /** The size every element reports from `measureInWindow`. */
  measured: { x: 0, y: 0, width: 200, height: 100 },
  window: { width: 1000, height: 800 },
  pointer: { x: 0, y: 0 },
  /** How many times an element was focused. */
  focused: 0,
  list: {
    /** The props the native list was last rendered with. */
    props: {} as AnyProps,
    scrollToIndex: [] as AnyProps[],
    scrollToOffset: [] as AnyProps[],
    /** What `getState()` reports. */
    scroll: 0,
    scrollLength: 400,
    rowHeight: 50
  }
};

export function reset() {
  // `keys` is left alone: components unregister their own when they unmount.
  state.scrollTo = [];
  state.measured = { x: 0, y: 0, width: 200, height: 100 };
  state.window = { width: 1000, height: 800 };
  state.pointer.x = 0;
  state.pointer.y = 0;
  state.focused = 0;
  state.list = {
    props: {},
    scrollToIndex: [],
    scrollToOffset: [],
    scroll: 0,
    scrollLength: 400,
    rowHeight: 50
  };
}

/** Presses a key the components registered for, as the platform would. */
export function pressKey(key: string) {
  let prevented = false;
  for (const entry of [...state.keys])
    if (entry.keys.includes(key))
      entry.handler({ key, preventDefault: () => (prevented = true) });
  return prevented;
}

function elementHandle() {
  return {
    focus: () => void state.focused++,
    blur: () => {},
    measureInWindow: (
      callback: (x: number, y: number, width: number, height: number) => void
    ) => {
      const { x, y, width, height } = state.measured;
      callback(x, y, width, height);
    }
  };
}

function host(type: string) {
  return forwardRef<unknown, AnyProps>(function Host(props, ref) {
    useImperativeHandle(ref, elementHandle, []);
    return createElement(type, props);
  });
}

export function reactNative() {
  const ScrollView = forwardRef<unknown, AnyProps>(function ScrollView(
    props,
    ref
  ) {
    useImperativeHandle(
      ref,
      () => ({
        ...elementHandle(),
        scrollTo: (options: AnyProps) => void state.scrollTo.push(options)
      }),
      []
    );
    return createElement("ScrollView", props);
  });
  return {
    View: host("View"),
    Pressable: host("Pressable"),
    ScrollView,
    experimental_LayoutConformance: (props: { children?: ReactNode }) =>
      props.children
  };
}

export function platform() {
  return {
    config: { get: () => undefined, set: () => {}, remove: () => {} },
    environment: { os: "macOS", isDev: false },
    keyboard: {
      register: (keys: string[], handler: (event: any) => void) => {
        const entry = { keys, handler };
        state.keys.push(entry);
        return () => {
          const index = state.keys.indexOf(entry);
          if (index >= 0) state.keys.splice(index, 1);
        };
      }
    }
  };
}

export function useStyledModule() {
  return {
    lastPointer: state.pointer,
    key: (event: unknown) => event,
    useStyled: (props: AnyProps, options: AnyProps = {}) => ({
      resolved: {},
      textStyle: undefined,
      viewStyle: { ...options.defaults, ...props.sx },
      nativeProps: {
        ...(props.testID ? { testID: props.testID } : {}),
        ...(props.id ? { nativeID: props.id } : {}),
        ...(props.onWheel ? { onWheel: props.onWheel } : {})
      }
    })
  };
}

export function primitives() {
  return {
    Box: host("Box"),
    Flex: host("Flex"),
    Button: host("Button"),
    Text: host("Text"),
    Icon: host("Icon")
  };
}

export function hooks() {
  return { useWindowSize: () => state.window };
}

export function theme() {
  return {
    ThemeScope: (props: AnyProps) => createElement("ThemeScope", props),
    useThemeContext: () => ({ definition: { colorScheme: "light" } })
  };
}

export function icons() {
  const icon = () => null;
  return {
    Close: icon,
    Loading: icon,
    mdiIcon: () => icon,
    svgIcon: () => icon
  };
}

/**
 * The native virtualized list, without virtualization: every row is rendered,
 * and what it was asked to scroll to is recorded in `state.list`.
 */
export function legendList() {
  const LegendList = forwardRef<unknown, AnyProps>(function LegendList(
    props,
    ref
  ) {
    state.list.props = props;
    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: async (target: AnyProps) =>
          void state.list.scrollToIndex.push(target),
        scrollToOffset: async (target: AnyProps) =>
          void state.list.scrollToOffset.push(target),
        getState: () => ({
          scroll: state.list.scroll,
          scrollLength: state.list.scrollLength,
          positionAtIndex: (index: number) => index * state.list.rowHeight,
          sizeAtIndex: () => state.list.rowHeight
        })
      }),
      []
    );
    const data: number[] = props.data;
    const children = createElement(
      Fragment,
      null,
      props.ListHeaderComponent,
      data.length === 0 ? props.ListEmptyComponent : null,
      data.map((item, index) =>
        createElement(
          "Row",
          {
            key: props.keyExtractor(item, index),
            rowKey: props.keyExtractor(item, index)
          },
          props.renderItem({ item, index })
        )
      ),
      props.ListFooterComponent
    );
    const scrollProps = { testID: "list-scroll", children };
    return props.renderScrollComponent
      ? props.renderScrollComponent(scrollProps)
      : createElement("ScrollView", scrollProps);
  });
  return { LegendList };
}
