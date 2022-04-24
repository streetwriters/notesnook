// eslint-disable-next-line @typescript-eslint/ban-types
export type LiteralUnion<T extends U, U = string> = T | (U & {});

// types from notesnook-core
export type CollectionTypes = 'notes' | 'notebooks' | 'attachments' | 'content' | 'tags' | 'colors';
export type EntityTypes =
  | 'note'
  | 'notebook'
  | 'tiny'
  | 'topic'
  | 'attachment'
  | 'settings'
  | 'trash'
  | 'tag'
  | 'color'
  | 'header';

export type CollectionEntityTypeMap = {
  notes: 'note';
  notebooks: 'notebook';
  attachments: 'attachment';
  content: 'tiny';
  tags: 'tag';
  colors: 'color';
};

export type Item = NoteType | NotebookType | TopicType | AttachmentType | TagType | TrashType;

export type MonographType = {
  type: 'monograph';
};

export interface Entity<TType extends EntityTypes> {
  id: string;
  type: TType;
  dateModified: number;
  dateCreated: number;

  // flags
  migrated?: boolean;
  remote?: boolean;
  deleted?: boolean;
}

export type NotebookReference = {
  id: string;
  topics: string[];
};

export interface NoteType extends Entity<'note'> {
  title: string;
  notebooks: NotebookReference[];
  tags: string[];
  dateCreated: number;
  dateEdited: number;

  pinned: boolean;
  locked: boolean;
  favorite: boolean;
  localOnly: boolean;
  conflicted: boolean;
  readonly: boolean;

  contentId?: string;
  headline?: string;
  color?: string;
}

export interface NotebookType extends Entity<'notebook'> {
  title: string;
  description?: string;
  dateCreated: number;
  dateEdited: number;
  pinned: boolean;
  topics: TopicType[];
}

export interface TopicType extends Entity<'topic'> {
  title: string;
  notebookId: string;
  notes: string[];
  dateCreated: number;
  dateEdited: number;
}

export interface AttachmentType extends Entity<'attachment'> {
  noteIds: string[];
  iv: string;
  salt: string;
  length: number;
  alg: string; // TODO
  chunkSize: number;
  key: {
    iv: string;
    salt: string;
    length: number;
    cipher: string;
    alg: string; // TODO
  };
  metadata: {
    hash: string;
    hashType: string; // TODO
    filename: string;
    type: string;
  };
  dateCreated: number;
  dateEdited: number;
  dateUploaded: number;
  dateDeleted: number;
}

interface BaseTag<TType extends 'tag' | 'color'> extends Entity<TType> {
  title: string;
  alias?: string;
  noteIds: string[];
}

export type TagType = BaseTag<'tag'>;
export type ColorType = BaseTag<'color'>;

type TrashItem<TItem extends Entity<'note' | 'notebook'>> = Entity<'trash'> & {
  title: string;
  itemType: TItem['type'];
  dateDeleted: number;
  deleted: boolean;
} & Omit<TItem, 'id' | 'type'>;

type TrashType = TrashItem<NoteType> | TrashItem<NotebookType>;

export interface GroupHeader extends Omit<Entity<'header'>, 'id' | 'dateCreated' | 'dateModified'> {
  title: string;
}
