
export enum ContentTypes {
  Note = "Note",
  Tag = "Tag",
  SmartTag = "SN|SmartTag",
  Component = "SN|Component" 
}

export type EditorType = {
  type: "code" | "html" | "text" | "json" | "markdown";
  jsonFormat?: "table" | "token";
  language?: string;
};

export type SpreadSheet = {
  sheets: { rows: Row[] }[];
};

export interface Row {
  index: number;
  cells: Cell[];
}

export interface Cell {
  value: number | string;
  index: number;
  format?: string;
  bold?: boolean;
}

export type TokenVaultItem = {
  [name: string]: string;
  service: string;
  account: string;
  secret: string;
  notes: string;
  password: string;
};

export type SNBackup = {
  version?: string;
  items?: SNBackupItem[];
};

export type SNBackupItem = {
  uuid: string;
  content_type: ContentTypes;
  content: {
    title: string;
    text: string;
    name: string;
    editorType: EditorType;
    references: {
      uuid: string;
      content_type: string;
    }[];
    appData: {
      "org.standardnotes.sn": {
        client_updated_at: string;
        pinned: boolean;
        prefersPlainEditor: boolean;
        archived?: boolean;
        defaultEditor?: boolean;
      };
      "org.standardnotes.sn.components": { [name: string]: string };
    };
    preview_html: string;
    preview_plain: string;
  };
  created_at: string;
  updated_at: string;
  created_at_timestamp: number;
  updated_at_timestamp: number;
  duplicate_of: null;
};
