import React, { HTMLProps } from 'react';
import { Editor } from './Editor';
import { ReactRenderer } from './ReactRenderer';
export interface EditorContentProps extends HTMLProps<HTMLDivElement> {
    editor: Editor | null;
}
export interface EditorContentState {
    renderers: Map<string, ReactRenderer>;
}
export declare class PureEditorContent extends React.Component<EditorContentProps, EditorContentState> {
    editorContentRef: React.RefObject<any>;
    constructor(props: EditorContentProps);
    componentDidMount(): void;
    componentDidUpdate(): void;
    init(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export declare const EditorContent: React.MemoExoticComponent<typeof PureEditorContent>;
