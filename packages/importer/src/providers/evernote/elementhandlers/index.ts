import { ENTaskGroup } from "./en-task-group";
import type { Note as ENNote } from "@notesnook/enex/src/note";
import type { IElementHandler } from "@notesnook/enex/src/content";
import type { HTMLElement } from "node-html-parser";
import { Note } from "../../../models/note";
import { ENMedia } from "./en-media";
import { IMGDataurl } from "./img-dataurl";
import { IHasher } from "../../../utils/hasher";
import { ENTodo } from "./en-todo";
import { ENCodeblock } from "./en-codeblock";

const elementMap = {
  "en-media": ENMedia,
  "img-dataurl": IMGDataurl,
  "en-task-group": ENTaskGroup,
  "en-todo": ENTodo,
  "en-codeblock": ENCodeblock,
};
type Keys = keyof typeof elementMap;

export class ElementHandler implements IElementHandler {
  constructor(
    private readonly note: Note,
    private readonly enNote: ENNote,
    private readonly hasher: IHasher
  ) {}

  async process(
    elementType: Keys,
    element: HTMLElement
  ): Promise<string | undefined> {
    const elementHandler = elementMap[elementType];
    if (!elementHandler) return;

    return new elementHandler(this.note, this.enNote, this.hasher).process(
      element
    );
  }
}
