import { createNavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { TextInput, View } from 'react-native';
import Tabs from '../components/tabs';

export const inputRef = createRef<TextInput>();
export const rootNavigatorRef = createNavigationContainerRef();
export const tabBarRef = createRef<Tabs>();
export const editorRef = createRef<View>();
