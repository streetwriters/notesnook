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

export { AvatarEditor, DragGhostHost, PdfViewer, WebView } from "./embeds";
export { default as Modal } from "react-modal";
export * from "./hooks";
export { LayoutRoot, Pane, ScrollContainer, SplitPane } from "./layout";
export { TITLE_BAR_HEIGHT, TitleBar } from "./layout";
export { GroupedVirtuoso, TableVirtuoso, Virtuoso } from "./lists";
// The types the contract names: the primitives' and Modal's are the
// contract's; the lists are react-virtuoso's own, so their types are too.
export type {
  AriaAttributes,
  BaseProps,
  BoxProps,
  ButtonProps,
  CheckboxProps,
  ColorPickerProps,
  DataAttributes,
  DonutProps,
  ElementTag,
  FlexProps,
  GridProps,
  IconProps,
  ImageProps,
  InputProps,
  LabelProps,
  LinkProps,
  ProgressProps,
  QRCodeHandle,
  QRCodeProps,
  RadioProps,
  SelectProps,
  SliderProps,
  SwitchProps,
  TextareaProps,
  TextProps,
  TextVariantPath,
  ThemeScopeProps
} from "../contracts/primitives";
export type { ModalProps, ModalStyles } from "../contracts/dialog";
export type {
  CalculateViewLocation,
  CalculateViewLocationParams,
  Components,
  ComputeItemKey,
  ContextProp,
  FixedHeaderContent,
  FlatIndexLocationWithAlign,
  FlatScrollIntoViewLocation,
  GroupContent,
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps,
  GroupItemContent,
  IndexLocationWithAlign,
  ItemContent,
  ItemProps,
  LocationOptions,
  ScrollerProps,
  ScrollIntoViewLocation,
  ScrollIntoViewLocationOptions,
  TableComponents,
  TableVirtuosoHandle,
  TableVirtuosoProps,
  TopItemListProps,
  VirtuosoHandle,
  VirtuosoProps
} from "react-virtuoso";
export { SortableList } from "./sortable-list";
export { Popover, PopoverHost, ResponsivePresenter } from "./popover";
// The menu and popup hosts are the ones apps/web already uses.
export { MenuPresenter, PopupPresenter } from "@notesnook/ui";
export { useThemeUI } from "@theme-ui/core";
export { alpha } from "@theme-ui/color";
export { createButtonVariant } from "@notesnook/theme";
export { showToast, ToastHost } from "./toast";
export * from "./primitives";
export { WebThemeProvider, ThemeScope } from "./theme";
export { ThemeBridge, syncThemeEngine } from "./theme-bridge";
export { dataColor } from "../shared/style/data-color";
export {
  ListSelectionContext,
  useListCursor,
  useListSelection
} from "../shared/list-selection";
