import React from "react";
import { Box } from "rebass";

function Form(props) {
  const { gutter, children, form } = props;
  const childrenWithGutter = React.Children.map(children, (child, index) => {
    if (!child) return;
    const props = { mt: index && gutter, form };
    return React.cloneElement(child, props);
  });
  return <Box {...props}>{childrenWithGutter}</Box>;
}

export default Form;
