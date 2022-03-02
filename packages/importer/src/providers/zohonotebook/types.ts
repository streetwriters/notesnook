export type ZNotebook = {
  cover: { is_private: boolean; cover_id: string };
  data_type: "NOTEBOOK";
  name: string;
  created_date: string;
  modified_date: string;
  notebook_id: string;
};
