import create from "zustand";
import shallow from "zustand/shallow";
import {
  MenuItem,
  // Resolvable,
  // ResolvedMenuItem,
  // ResolverFunction,
} from "./types";

type PositionData = {
  x: number;
  y: number;
  actualX: number;
  actualY: number;
  width?: number;
  height?: number;
};

const mousePosition: PositionData = { x: 0, y: 0, actualX: 0, actualY: 0 };
window.addEventListener("mousemove", (e) => {
  const { x, y, actualX, actualY } = getMousePosition(e);
  mousePosition.x = x;
  mousePosition.y = y;
  mousePosition.actualX = actualX;
  mousePosition.actualY = actualY;
});

export type MenuOptions = {
  type: "autocomplete" | "menu";
  position?: PositionOptions;
};
// interface IMenuStore {
//   isOpen?: boolean;
//   // items?: ResolvedMenuItem<any>[];
//   items?: MenuItem[];
//   title?: string;
//   options?: MenuOptions;
//   //data?: any;

//   //  open: <TData>(items: MenuItem<TData>[], data: TData) => void;
//   open: (items: MenuItem[]) => void;
//   close: () => void;
// }

// const useMenuStore = create<IMenuStore>((set) => ({
//   isOpen: false,
//   items: [],
//   title: undefined,
//   options: undefined,
//   // data: undefined,
//   // open: <TData>(items: MenuItem<TData>[], data: TData) =>
//   //   set((state) => {
//   //     state.isOpen = true;
//   //     state.items = mapMenuItems(items, data);
//   //     //   state.data = data;
//   //   }),
//   open: (items: MenuItem[], options?: MenuOptions) =>
//     set((state) => {
//       state.isOpen = true;
//       state.items = items.filter((item) => !item.isHidden);
//       state.options = options;
//       //   state.data = data;
//     }),
//   close: () =>
//     set((state) => {
//       state.isOpen = false;
//       state.items = [];
//       state.options = undefined;
//       //  state.data = undefined;
//       state.title = undefined;
//     }),
// }));

// export function useMenuTrigger() {
//   const isOpen = useMenuStore((store) => store.isOpen);
//   const [open, close] = useMenuStore(
//     (store) => [store.open, store.close],
//     shallow
//   );

//   return {
//     openMenu: open,
//     closeMenu: close,
//     isOpen,
//   };
// }

// export function useMenu() {
//   const [items, options] = useMenuStore((store) => [
//     store.items,
//     store.options,
//   ]);
//   return { items, options };
// }

type PositionOptions = {
  target?: HTMLElement | "mouse";
  isTargetAbsolute?: boolean;
  location?: "right" | "left" | "below" | "top";
  align?: "center" | "start" | "end";
  yOffset?: number;
  xOffset?: number;
  yAnchor?: HTMLElement;
  parent?: HTMLElement | Element;
};
export function getPosition(
  element: HTMLElement,
  options: PositionOptions
): { top: number; left: number } {
  const {
    target = "mouse",
    isTargetAbsolute = false,
    location = undefined,
    yOffset = 0,
    xOffset = 0,
    align = "start",
    parent = document.body,
    yAnchor,
  } = options || {};

  const { x, y, width, height, actualX, actualY } =
    target === "mouse"
      ? mousePosition
      : getElementPosition(target, isTargetAbsolute);

  const elementWidth = element.offsetWidth;
  const elementHeight = element.offsetHeight;

  const windowWidth = parent.clientWidth;
  const windowHeight = parent.clientHeight - 20;

  let position = { top: 0, left: 0 };

  if (windowWidth - actualX < elementWidth) {
    const xDiff = actualX - x;
    position.left = windowWidth - elementWidth;
    position.left -= xDiff;
  } else {
    position.left = x;
  }

  if (width) {
    if (location === "right") position.left += width;
    else if (location === "left") position.left -= elementWidth;
  }

  if (windowHeight - actualY < elementHeight) {
    const yDiff = actualY - y;
    position.top = windowHeight - elementHeight;
    position.top -= yDiff;
  } else {
    position.top = y;
  }

  if (height) {
    if (location === "below") position.top += height;
    else if (location === "top") position.top -= height;
  }

  if (target !== "mouse" && align === "center" && elementWidth > 0) {
    position.left -= elementWidth / 2 - target.clientWidth / 2;
  }

  // Adjust menu height
  if (elementHeight > windowHeight - position.top) {
    element.style.maxHeight = `${windowHeight - 20}px`;
  }

  if (yAnchor) {
    const anchorY = getElementPosition(yAnchor, isTargetAbsolute);
    position.top = anchorY.actualY - elementHeight;
  }

  position.top = position.top < 0 ? 0 : position.top;
  position.left = position.left < 0 ? 0 : position.left;
  position.top += yOffset;
  position.left += xOffset;

  return position;
}

function getMousePosition(e: MouseEvent) {
  var posx = 0;
  var posy = 0;

  if (!e && window.event) e = window.event as MouseEvent;

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx =
      e.clientX +
      document.body.scrollLeft +
      document.documentElement.scrollLeft;
    posy =
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  return {
    x: posx,
    y: posy,
    actualY: posy,
    actualX: posx,
  };
}

export function getElementPosition(
  element: HTMLElement,
  absolute: boolean
): PositionData {
  const rect = element.getBoundingClientRect();
  const position: PositionData = {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: rect.width,
    height: rect.height,
    actualY: rect.y,
    actualX: rect.x,
  };
  if (absolute) {
    position.x = position.actualX;
    position.y = position.actualY;
  }
  return position;
}

// function mapMenuItems<TData>(
//   items: MenuItem<TData>[],
//   data: TData
// ): ResolvedMenuItem<TData>[] {
//   return items.reduce((prev, item) => {
//     const { key, onClick: _onClick, disabled, hidden, checked, type } = item;

//     const isHidden = resolveProp(hidden, data, item);
//     if (isHidden) return prev;

//     const isSeperator = type === "seperator";
//     if (isSeperator) {
//       prev.push({ isSeperator: true });
//       return prev;
//     }

//     const title = resolveProp(item.title, data, item);
//     const icon = resolveProp(item.icon, data, item);
//     const isChecked = resolveProp(checked, data, item);
//     const isDisabled = resolveProp(disabled, data, item);
//     const items = resolveProp(item.items, data, item);
//     const modifier = resolveProp(item.modifier, data, item);
//     const onClick =
//       typeof _onClick === "function" && _onClick.bind(this, data, item);

//     const tooltip =
//       isDisabled || resolveProp(item.tooltip, data, item) || title;
//     const hasSubmenu = items?.length > 0;

//     const menuItem: ResolvedMenuItem<TData> = {
//       type,
//       title,
//       key,
//       onClick,
//       tooltip,

//       isChecked,
//       isDisabled: !!isDisabled,
//       isHidden,
//       hasSubmenu,
//       icon,
//       modifier: modifier?.join("+"),
//     };

//     if (hasSubmenu)
//       menuItem.items = mapMenuItems(items, { ...data, parent: menuItem });

//     prev.push(menuItem);

//     return prev;
//   }, []);
// }

// function resolveProp<T, TData>(
//   prop: Resolvable<T, TData>,
//   data: any,
//   item: MenuItem<TData>
// ): T {
//   if (typeof prop === "function" && (prop as any).isReactComponent) {
//     return prop as T;
//   }
//   return isResolverFunction<T, TData>(prop) ? prop(data, item) : prop;
// }

// function isResolverFunction<T, TData>(
//   prop: any
// ): prop is ResolverFunction<T, TData> {
//   return typeof prop === "function";
// }
