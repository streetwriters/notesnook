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
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import useIsFloatingKeyboard from "../../hooks/use-is-floating-keyboard";
import { useSettingStore } from "../../stores/use-setting-store";
import { Header } from "../header";
import SelectionHeader from "../selection-header";
export const Container = ({ children }) => {
  const floating = useIsFloatingKeyboard();
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === "ios" && !floating}
      style={{
        flex: 1
      }}
    >
      <SafeAreaView
        style={{
          flex: 1,
          overflow: "hidden"
        }}
      >
        {!introCompleted ? null : (
          <>
            <SelectionHeader />
            <Header title="Header" screen="Header" />
          </>
        )}

        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
