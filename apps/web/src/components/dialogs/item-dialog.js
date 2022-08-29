import React from "react";
import { Box } from "@streetwriters/rebass";
import Dialog from "./dialog";
import Field from "../field";

function ItemDialog(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      positiveButton={{
        props: {
          form: "itemForm",
          type: "submit"
        },
        text: props.title
      }}
      onClose={props.onClose}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Box
        as="form"
        id="itemForm"
        onSubmit={(e) => {
          e.preventDefault();
          const title = e.target.title.value;
          props.onAction(title);
        }}
      >
        <Field
          required
          label="Title"
          id="title"
          name="title"
          autoFocus
          data-test-id="item-dialog-title"
          defaultValue={props.defaultValue}
        />
      </Box>
    </Dialog>
  );
}

export default ItemDialog;
