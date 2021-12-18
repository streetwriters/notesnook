export interface KeepNote {
  attachments?: Attachment[];
  color?: string;
  isTrashed?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  textContent?: string;
  listContent?: ListItem[];
  annotations?: Annotation[];
  title?: string;
  userEditedTimestampUsec: number;
  labels?: Label[];
}

export interface Annotation {
  description?: string;
  source?: string;
  title?: string;
  url?: string;
}

export interface Attachment {
  filePath: string;
  mimetype: string;
}

export interface Label {
  name: string;
}

export interface ListItem {
  text: string;
  isChecked: boolean;
}

export function listToHTML(list: ListItem[]): string {
  return `<ul class="checklist">
        ${list
          .map((t) =>
            t.isChecked
              ? `<li class="checked">${t.text}</li>`
              : `<li>${t.text}</li>`
          )
          .join("")}
      </ul>`;
}
