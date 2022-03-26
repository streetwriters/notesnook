import type { IElementHandler } from "@notesnook/enex/dist/src/content";
import type { HTMLElement } from "node-html-parser";
import { ZNResource } from "./znresource";
import { IHasher } from "../../../utils/hasher";
import { ZNChecklist } from "./znchecklist";
import { File } from "../../../utils/file";
import { Note } from "../../../models/note";

const elementMap = {
  "znresource": ZNResource,
  "znchecklist": ZNChecklist,
};
type Keys = keyof typeof elementMap;

export class ElementHandler implements IElementHandler {
  constructor(
    private readonly note: Note,
    private readonly files: File[],
    private readonly hasher: IHasher
  ) {}

  async process(
    elementType: Keys,
    element: HTMLElement
  ): Promise<string | undefined> {
    const elementHandler = elementMap[elementType];
    if (!elementHandler) return;

    return new elementHandler(this.note, this.files, this.hasher).process(
      element
    );
  }
}
