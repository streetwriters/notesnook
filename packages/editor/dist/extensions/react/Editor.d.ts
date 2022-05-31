import React from 'react';
import { Editor as CoreEditor } from '@tiptap/core';
import { EditorContentProps, EditorContentState } from './EditorContent';
export declare class Editor extends CoreEditor {
    contentComponent: React.Component<EditorContentProps, EditorContentState> | null;
}
