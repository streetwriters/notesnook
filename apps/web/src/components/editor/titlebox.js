import React from "react";
import "./editor.css";
import { Input } from "@rebass/forms";

export default class TitleBox extends React.Component {
  inputRef;
  shouldComponentUpdate(nextProps) {
    return nextProps.title !== this.props.title || nextProps.shouldFocus;
  }

  componentDidUpdate() {
    if (this.props.shouldFocus) {
      this.inputRef.focus();
    }
  }

  render() {
    const { title, setTitle } = this.props;
    return (
      <Input
        ref={ref => (this.inputRef = ref)}
        maxLength={120}
        placeholder="Untitled"
        fontFamily="heading"
        fontWeight="heading"
        fontSize="heading"
        display={["none", "flex", "flex"]}
        sx={{
          borderWidth: 0,
          ":focus": { outline: "none" }
        }}
        py={2}
        px={2}
        value={title}
        onChange={e => {
          setTitle(e.target.value);
        }}
      />
    );
  }
}
