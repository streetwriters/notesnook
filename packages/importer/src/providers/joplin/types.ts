/**
 * We cannot use @joplin/lib directly because Typescript throws errors
 * during compilation. Until those errors are fixed upstream, we'll have to
 * use extracted types.
 */

// Extracted from https://github.com/laurent22/joplin/blob/2acd55eb810d9d6f6e4b2e1c6adff9ce72dde956/packages/lib/BaseModel.ts
export enum ModelType {
  Note = 1,
  Folder = 2,
  Setting = 3,
  Resource = 4,
  Tag = 5,
  NoteTag = 6,
  Search = 7,
  Alarm = 8,
  MasterKey = 9,
  ItemChange = 10,
  NoteResource = 11,
  ResourceLocalState = 12,
  Revision = 13,
  Migration = 14,
  SmartFilter = 15,
  Command = 16,
}

/**
 * All the below types have been extracted from: https://github.com/laurent22/joplin/blob/2acd55eb810d9d6f6e4b2e1c6adff9ce72dde956/packages/lib/services/database/types.ts
 */

export interface FolderEntity {
  id?: string | null;
  title?: string;
  created_time?: number;
  updated_time?: number;
  user_created_time?: number;
  user_updated_time?: number;
  encryption_cipher_text?: string;
  encryption_applied?: number;
  parent_id?: string;
  is_shared?: number;
  share_id?: string;
  master_key_id?: string;
  icon?: string;
  type_?: number;
}

export interface NoteTagEntity {
  id?: string | null;
  note_id?: string;
  tag_id?: string;
  created_time?: number;
  updated_time?: number;
  user_created_time?: number;
  user_updated_time?: number;
  encryption_cipher_text?: string;
  encryption_applied?: number;
  is_shared?: number;
  type_?: number;
}
export interface NoteEntity {
  id?: string | null;
  parent_id?: string;
  title?: string;
  body?: string;
  created_time?: number;
  updated_time?: number;
  is_conflict?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  author?: string;
  source_url?: string;
  is_todo?: number;
  todo_due?: number;
  todo_completed?: number;
  source?: string;
  source_application?: string;
  application_data?: string;
  order?: number;
  user_created_time?: number;
  user_updated_time?: number;
  encryption_cipher_text?: string;
  encryption_applied?: number;
  markup_language?: number;
  is_shared?: number;
  share_id?: string;
  conflict_original_id?: string;
  master_key_id?: string;
  type_?: number;
}

export interface ResourceEntity {
  id?: string | null;
  title?: string;
  mime?: string;
  filename?: string;
  created_time?: number;
  updated_time?: number;
  user_created_time?: number;
  user_updated_time?: number;
  file_extension?: string;
  encryption_cipher_text?: string;
  encryption_applied?: number;
  encryption_blob_encrypted?: number;
  size?: number;
  is_shared?: number;
  share_id?: string;
  master_key_id?: string;
  type_?: number;
}

export interface TagEntity {
  id?: string | null;
  title?: string;
  created_time?: number;
  updated_time?: number;
  user_created_time?: number;
  user_updated_time?: number;
  encryption_cipher_text?: string;
  encryption_applied?: number;
  is_shared?: number;
  parent_id?: string;
  type_?: number;
}
