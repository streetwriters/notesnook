import { EditorOptions } from "@tiptap/core";
import { DependencyList } from "react";
import { Editor as EditorType } from "../types";
export declare const useEditor: (options?: Partial<EditorOptions>, deps?: DependencyList) => EditorType | null;
