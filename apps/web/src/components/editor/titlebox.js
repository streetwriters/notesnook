import React from "react";
import "./editor.css";
import { Input } from "@rebass/forms";
import { Flex } from "rebass";
import * as Icon from "react-feather";
import { store as appStore } from "../../stores/app-store";

export default class TitleBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      iconType: Icon.PlusCircle
    };
    //this.ChangeIcon.bind(this);
  }

  ChangeIcon() {
    this.setState({
      iconType:
        this.state.iconType === Icon.PlusCircle
          ? Icon.MinusCircle
          : Icon.PlusCircle
    });
  }

  inputRef;
  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.title !== this.props.title ||
      nextProps.shouldFocus ||
      nextState.iconType !== this.state.iconType
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
            if (this.state.iconType === Icon.PlusCircle) {
              appStore.getState().enableFocusMode();
            } else {
              appStore.getState().disableFocusMode();
            }
            this.ChangeIcon();
          }}
        >
          <this.state.iconType size="30px"></this.state.iconType>
        </Flex>
      </Flex>
    );
  }
}
