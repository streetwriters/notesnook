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

import { createNavigationContainerRef } from "@react-navigation/native";
import { createRef } from "react";
import { TextInput, View } from "react-native";
import { TabsRef } from "../components/fluid-panels";
import { RootRouteParams, RouteParams } from "../stores/use-navigation-store";

export const inputRef = createRef<TextInput>();
export const rootNavigatorRef = createNavigationContainerRef<RootRouteParams>();
export const appNavigatorRef = createNavigationContainerRef<RouteParams>();
export const fluidTabsRef = createRef<TabsRef>();
export const editorRef = createRef<View>();
