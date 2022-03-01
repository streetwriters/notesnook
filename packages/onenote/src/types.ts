export type GraphAPIResponse<T> = {
  ["@odata.nextLink"]?: string;
  ["@odata.context"]?: string;
  value?: T;
};
