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
import { ToastEvent } from "../../../services/event-manager";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
export const ShareComponent = ({ uri, name, padding }) => {
  return (
    <View
      style={{
        paddingHorizontal: padding
      }}
    >
      <Button
        title="Open"
        type="accent"
        width="100%"
        fontSize={SIZE.md}
        onPress={async () => {
          FileViewer.open(uri, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
          }).catch(() => {
            ToastEvent.show({
              heading: "Cannot open",
              message: `No application found to open ${name} file.`,
              type: "success",
              context: "local"
            });
          });
        }}
        height={50}
      />
      <Button
        title="Share"
        type="shade"
        width="100%"
        fontSize={SIZE.md}
        style={{
          marginTop: 10
        }}
        onPress={async () => {
          FileViewer.open(uri, {
            showOpenWithDialog: true,
            showAppsSuggestions: true,
            shareFile: true
          }).catch(console.log);
        }}
        height={50}
      />
    </View>
  );
};
