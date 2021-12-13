export type SimplenoteExport = {
  activeNotes?: SimplenoteNote[];
  trashNotes?: SimplenoteNote[];
};

type SimplenoteNote = {
  id?: string;
  content?: string;
  creationDate?: string;
  lastModified?: string;
  pinned?: boolean;
  deleted: boolean;
  markdown?: boolean;
  publicURL?: string;
  tags?: string[];
  collaboratorEmails?: string[];
};
