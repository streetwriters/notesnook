import { createNavigationContainerRef } from "@react-navigation/native";
import { createRef } from "react";
import { TextInput, View } from "react-native";
import { TabsRef } from "../components/tabs";
import { RouteParams } from "../stores/use-navigation-store";

export const inputRef = createRef<TextInput>();
export const rootNavigatorRef = createNavigationContainerRef<RouteParams>();
export const tabBarRef = createRef<TabsRef>();
export const editorRef = createRef<View>();
