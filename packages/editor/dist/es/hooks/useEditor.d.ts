import { EditorOptions } from "@tiptap/core";
import { DependencyList } from "react";
import { Editor } from "../types";
export declare const useEditor: (options?: Partial<EditorOptions>, deps?: DependencyList) => Editor | null;
