/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { SafeAreaView } from "react-native";
import DelayLayout from "../components/delay-layout";
import DialogProvider from "../components/dialog-provider";
import { Header } from "../components/header";
import { Toast } from "../components/toast";
import { useNoteStore } from "../stores/use-notes-store";
import { useSettingStore } from "../stores/use-setting-store";
import { useThemeStore } from "../stores/use-theme-store";
import { TabHolder } from "./tabs-holder";

const _ApplicationHolder = () => {
  const loading = useNoteStore((state) => state.loading);
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  const colors = useThemeStore((state) => state.colors);

  return (
    <>
      {loading && introCompleted ? (
        <>
          <SafeAreaView
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: colors.bg
            }}
          >
            <Header />
            <DelayLayout animated={false} wait={loading} />
          </SafeAreaView>
        </>
      ) : (
        <>
          <TabHolder />
          <Toast />
        </>
      )}
      <DialogProvider />
    </>
  );
};
export const ApplicationHolder = React.memo(_ApplicationHolder, () => true);
