import {
  OnenotePage as _OnenotePage,
  Notebook as _Notebook,
  OnenoteSection as _OnenoteSection,
  SectionGroup as _SectionGroup,
  OnenoteResource,
} from "@microsoft/microsoft-graph-types-beta";

export type GraphAPIResponse<T> = {
  ["@odata.nextLink"]?: string;
  ["@odata.context"]?: string;
  value?: T;
};

export type OnenoteNotebook = _Notebook & {
  sections?: OnenoteSection[];
  sectionGroups?: OnenoteSectionGroup[];
};

export type OnenotePage = _OnenotePage & {
  content?: string;
  resources: OnenoteResource[];
};

export type OnenoteSection = _OnenoteSection & {
  pages?: OnenotePage[];
};

export type OnenoteSectionGroup = _SectionGroup & {
  sections?: OnenoteSection[];
  sectionGroups?: OnenoteSectionGroup[];
};
export { OnenoteResource };
