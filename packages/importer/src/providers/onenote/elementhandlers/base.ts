import { IHasher } from "../../../utils/hasher";
import { Note } from "../../../models/note";
import type { HTMLElement } from "node-html-parser";

export abstract class BaseHandler {
  constructor(
    protected readonly note: Note,
    protected readonly hasher: IHasher
  ) {}

  abstract process(element: HTMLElement): Promise<string | undefined>;
}
