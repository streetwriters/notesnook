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

import React from "react";
import { View } from "react-native";
import FileViewer from "react-native-file-viewer";
import { ToastManager } from "../../../services/event-manager";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import { strings } from "@notesnook/intl";
export const ShareComponent = ({ uri, name, padding }) => {
  return (
    <View
      style={{
        paddingHorizontal: padding
      }}
    >
      <Button
        title={strings.open()}
        type="accent"
        width="100%"
        fontSize={AppFontSize.md}
        onPress={async () => {
          FileViewer.open(uri, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
          }).catch(() => {
            ToastManager.show({
              heading: strings.noApplicationFound(name),
              type: "success",
              context: "local"
            });
          });
        }}
      />
      <Button
        title={strings.share()}
        type="shade"
        width="100%"
        fontSize={AppFontSize.md}
        style={{
          marginTop: 10
        }}
        onPress={async () => {
          FileViewer.open(uri, {
            showOpenWithDialog: true,
            showAppsSuggestions: true,
            shareFile: true
          }).catch(() => {
            /* empty */
          });
        }}
      />
    </View>
  );
};
