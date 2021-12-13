import { Attachment } from "./attachment";

export type Note = {
  title: string;
  dateCreated?: number;
  dateEdited?: number;
  content?: Content;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
  color?: string;
  notebooks?: Notebook[];
  attachments?: Attachment[];
};

export type Content = {
  data: string;
  type: ContentType;
};

export enum ContentType {
  HTML = "html",
  TEXT = "text",
}

export type Notebook = {
  notebook: string;
  topic: string;
};
