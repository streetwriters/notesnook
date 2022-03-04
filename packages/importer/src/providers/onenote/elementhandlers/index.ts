import type { IElementHandler } from "@notesnook/enex/dist/src/content";
import type { HTMLElement } from "node-html-parser";
import { Note } from "../../../models/note";
import { AttachmentHandler } from "./attachment";
import { IHasher } from "../../../utils/hasher";

const elementMap = {
  "img": AttachmentHandler,
  "obj": AttachmentHandler,
};
type Keys = keyof typeof elementMap;

export class ElementHandler implements IElementHandler {
  constructor(
    private readonly note: Note,
    private readonly hasher: IHasher
  ) {}

  async process(
    elementType: Keys,
    element: HTMLElement
  ): Promise<string | undefined> {
    const elementHandler = elementMap[elementType];
    if (!elementHandler) return;

    return new elementHandler(this.note, this.hasher).process(
      element
    );
  }
}
