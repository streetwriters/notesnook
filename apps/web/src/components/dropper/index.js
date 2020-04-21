import React from "react";

function Dropper(props) {
  const { children } = props;
  const fillChildren = React.Children.map(children, (child, index) => {
    if (!child) return;
    const childProps = { ...props, children: child.props.children };
    return React.cloneElement(child, childProps);
  });
  return <React.Fragment>{fillChildren}</React.Fragment>;
}
export default Dropper;
