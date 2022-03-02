import { IHasher } from "../../../utils/hasher";
import type { HTMLElement } from "node-html-parser";
import {File}from "../../../utils/file"
import { Note } from "../../../models/note";

export abstract class BaseHandler {
  constructor(
    protected readonly note: Note,
    protected readonly files: File[],
    protected readonly hasher: IHasher
  ) {}

  abstract process(element: HTMLElement): Promise<string | undefined>;
}
