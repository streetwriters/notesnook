export type GraphAPIResponse<T> = {
  ["@odata.nextLink"]?: string;
  ["@odata.context"]?: string;
  value?: T;
};

export type ItemType = "notebook" | "sectionGroup" | "section" | "page";
export type Op = "fetch" | "process";
export type ProgressPayload = {
  type: ItemType;
  op: Op;
  total: number;
  current: number;
};

export interface IProgressReporter {
  report: (payload: ProgressPayload) => void;
  error: (e: Error) => void;
}
