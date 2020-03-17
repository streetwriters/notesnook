import React from "react";
import "./editor.css";
import { Input } from "@rebass/forms";
import { Flex } from "rebass";
import * as Icon from "../icons";
import { store as appStore } from "../../stores/app-store";

export default class TitleBox extends React.Component {
  state = { isFocusMode: false };

  inputRef;
  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.title !== this.props.title ||
      nextProps.shouldFocus ||
      nextState.isFocusMode !== this.state.isFocusMode
    );
  }

  componentDidUpdate() {
    if (this.props.shouldFocus) {
      this.inputRef.focus();
    }
  }

  render() {
    const { title, setTitle, sx } = this.props;
    return (
      <Flex>
        <Input
          ref={ref => (this.inputRef = ref)}
          maxLength={120}
          placeholder="Untitled"
          fontFamily="heading"
          fontWeight="heading"
          fontSize="heading"
          display={["none", "flex", "flex"]}
          px={2}
          sx={{
            borderWidth: 0,
            ":focus": { outline: "none" },
            ...sx
          }}
          value={title}
          onChange={e => {
            setTitle(e.target.value);
          }}
        />
        <Flex
          alignItems="center"
          pr={3}
          onClick={() => {
            const { enableFocusMode, disableFocusMode } = appStore.getState();
            if (!this.state.isFocusMode) {
              enableFocusMode();
              this.setState({ isFocusMode: true });
            } else {
              disableFocusMode();
              this.setState({ isFocusMode: false });
            }
          }}
        >
          {this.state.isFocusMode ? (
            <Icon.NormalMode size={30} />
          ) : (
            <Icon.FocusMode size={30} />
          )}
        </Flex>
      </Flex>
    );
  }
}
