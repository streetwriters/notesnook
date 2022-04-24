import { createNavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { TextInput, View } from 'react-native';
import { TabsRef } from '../components/tabs/new';

export const inputRef = createRef<TextInput>();
export const rootNavigatorRef = createNavigationContainerRef();
export const tabBarRef = createRef<TabsRef>();
export const editorRef = createRef<View>();
