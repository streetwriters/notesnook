import React, { useEffect, useRef } from "react";
import "./editor.css";
import { Input } from "@rebass/forms";

/* class TitleBox extends React.Component {
  inputRef;
  changeTimeout = 0;
  state = { text: "" };
  shouldComponentUpdate(nextProps) {
    return nextProps.title !== this.props.title || nextProps.shouldFocus;
  }

  componentDidUpdate() {
    if (this.props.shouldFocus) {
      this.inputRef.focus();
    }
  }

  render() {
    const { setTitle, sx, changeInterval } = this.props;
  }
} */
/* export default TitleBox; */
var changeTimeout;
function TitleBox(props) {
  const { sx, title, setTitle, changeInterval, shouldFocus } = props;
  const inputRef = useRef();

  useEffect(() => {
    if (!inputRef.current) return;
    clearTimeout(changeTimeout);
    inputRef.current.value = title;
  }, [title]);

  useEffect(() => {
    if (shouldFocus) inputRef.current.focus();
  }, [shouldFocus]);

  return (
    <Input
      ref={inputRef}
      autoFocus={shouldFocus}
      data-test-id="editor-title"
      maxLength={120}
      placeholder="Untitled"
      fontFamily="heading"
      fontWeight="heading"
      fontSize="heading"
      color="text"
      px={2}
      sx={{
        borderWidth: 0,
        ":focus": { outline: "none" },
        ...sx,
      }}
      onChange={(e) => {
        clearTimeout(changeTimeout);
        changeTimeout = setTimeout(
          setTitle.bind(this, e.target.value),
          changeInterval
        );
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return (
    prevProps.shouldFocus === nextProps.shouldFocus &&
    prevProps.title === nextProps.title
  );
});
