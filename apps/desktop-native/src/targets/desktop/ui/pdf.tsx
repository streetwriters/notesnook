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

import { forwardRef, type Ref } from "react";
import {
  PdfViewer as NativePdfViewer,
  type PdfViewerController
} from "@react-native-gpui/pdf";
import type * as Contract from "../../../ui/pdf";
import { useStyled } from "./style/use-styled";

export const PdfViewer = forwardRef<
  Contract.PdfViewerHandle,
  Contract.PdfViewerProps
>(function PdfViewer(props, ref) {
  const { viewStyle, nativeProps } = useStyled(
    { sx: props.sx, testID: props.testID },
    { defaults: { flex: 1 } }
  );
  return (
    <NativePdfViewer
      {...nativeProps}
      controllerRef={ref as Ref<PdfViewerController>}
      source={props.source}
      onStateChange={props.onStateChange}
      style={viewStyle}
    />
  );
});
