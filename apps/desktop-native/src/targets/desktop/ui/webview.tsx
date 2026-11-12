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

import { forwardRef, useImperativeHandle, useRef } from "react";
import { WebView as NativeWebView } from "react-native-webview";
import type * as Contract from "../../../ui/webview";
import { useStyled } from "./style/use-styled";

export const WebView = forwardRef<
  Contract.WebViewHandle,
  Contract.WebViewProps
>(function WebView(props, ref) {
  const native = useRef<NativeWebView<object>>(null);
  const { viewStyle, nativeProps } = useStyled(
    { sx: props.sx, testID: props.testID },
    { defaults: { flex: 1 } }
  );

  useImperativeHandle(
    ref,
    () => ({
      postMessage: (message) => native.current?.postMessage(message),
      reload: () => native.current?.reload(),
      injectJavaScript: (script) => native.current?.injectJavaScript(script)
    }),
    []
  );

  return (
    <NativeWebView<object>
      ref={native}
      testID={nativeProps.testID as string | undefined}
      style={viewStyle as never}
      source={props.source}
      injectedJavaScript={props.injectedJavaScript}
      onLoad={props.onLoad}
      onMessage={(event) => props.onMessage?.(event.nativeEvent.data)}
    />
  );
});
