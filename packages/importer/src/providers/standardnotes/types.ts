import {
  AppDataField,
  BackupFile,
  BackupFileDecryptedContextualPayload,
  ItemContent,
} from "@standardnotes/snjs";
import {
  ComponentArea,
  EditorFeatureDescription,
  NoteType,
} from "@standardnotes/features";
import { ContentType } from "@standardnotes/common";
import { NoteContent, TagContent, ComponentContent } from "@standardnotes/snjs";

enum ProtocolVersion {
  V001 = "001",
  V002 = "002",
  V003 = "003",
  V004 = "004",
}
const ComponentDataDomain = "org.standardnotes.sn.components";
const DefaultAppDomain = "org.standardnotes.sn";

type SNBackupItem<
  TContentType extends ContentType,
  TContent extends ItemContent
> = BackupFileDecryptedContextualPayload<TContent> & {
  content_type: TContentType;
  content: TContent & {
    appData: {
      [DefaultAppDomain]?: Record<AppDataField, any>;
      [ComponentDataDomain]?: Record<string, any | null | undefined>;
    };
  };
};

export type SNNote = SNBackupItem<ContentType.Note, NoteContent>;
export type SNComponent = SNBackupItem<ContentType.Component, ComponentContent>;
export type SNTag = SNBackupItem<ContentType.Tag, TagContent>;
export type SNBackup = BackupFile;
export type EditorDescription = Pick<
  EditorFeatureDescription,
  "note_type" | "file_type"
> & {
  language?: string;
};
export type CodeEditorComponentData = { mode?: string };

export type Spreadsheet = {
  sheets: kendo.ui.SpreadsheetSheet[];
};

export {
  DefaultAppDomain,
  ComponentDataDomain,
  ProtocolVersion,
  ContentType,
  ComponentArea,
  NoteType,
};
