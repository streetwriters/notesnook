import React from "react";
import { Flex, Box, Text, Button as RebassButton } from "rebass";
import { Input, Checkbox, Label } from "@rebass/forms";
import * as Icon from "react-feather";
import Dialog from "./dialog";
import { showSnack } from "../snackbar";

export default class AddNotebookDialog extends React.Component {
  title = [];
  description = [];
  _inputRefs = [];
  lastLength = 0;
  state = {
    topics: [],
    open: false
  };

  addTopic(index) {
    this.setState({ topics: this.state.topics.splice(index + 1, 0, "") }, () =>
      setTimeout(() => {
        this._inputRefs[index + 1].focus();
      }, 0)
    );
  }

  render() {
    const props = this.props;
    return (
      <Dialog
        isOpen={props.isOpen}
        title="Notebook"
        icon={Icon.BookOpen}
        content={
          <Box my={1}>
            <Input
              variant="default"
              onChange={e => (this.title = e.target.value)}
              placeholder="Enter name"
            />
            <Input
              variant="default"
              sx={{ marginTop: 1 }}
              onChange={e => (this.description = e.target.value)}
              placeholder="Enter description (optional)"
            />
            <Label alignItems="center" my={1}>
              <Checkbox variant="checkbox" />
              Locked?
            </Label>
            <Text variant="body" fontWeight="bold" my={1}>
              Topics (optional):
            </Text>
            <Box sx={{ maxHeight: 44 * 5, overflowY: "auto", marginBottom: 1 }}>
              {this.state.topics.map((value, index) => (
                <Flex
                  key={index.toString()}
                  flexDirection="row"
                  sx={{ marginBottom: 1 }}
                >
                  <Input
                    ref={ref => (this._inputRefs[index] = ref)}
                    variant="default"
                    value={this.state.topics[index]}
                    placeholder="Topic name"
                    onFocus={e => {
                      this.lastLength = e.nativeEvent.target.value.length;
                    }}
                    onChange={e => {
                      const { topics } = this.state;
                      topics[index] = e.target.value;
                      this.setState({
                        topics
                      });
                    }}
                    onKeyUp={e => {
                      if (e.nativeEvent.key === "Enter") {
                        this.addTopic(index);
                      } else if (
                        e.nativeEvent.key === "Backspace" &&
                        this.lastLength === 0 &&
                        index > 0
                      ) {
                        this.setState(
                          {
                            topics: this.state.topics.splice(index, 1)
                          },
                          () => {
                            setTimeout(() => {
                              this._inputRefs[index - 1].focus();
                            }, 0);
                          }
                        );
                      }
                      this.lastLength = e.nativeEvent.target.value.length;
                    }}
                  />
                  <RebassButton
                    variant="tertiary"
                    sx={{ marginLeft: 1 }}
                    px={2}
                    py={1}
                    onClick={() => this.addTopic(index)}
                  >
                    <Box height={20}>
                      <Icon.Plus size={20} />
                    </Box>
                  </RebassButton>
                </Flex>
              ))}
            </Box>
          </Box>
        }
        positiveButton={{
          text: "Add",
          onClick: () => {
            if (!this.title.trim().length)
              return showSnack("Please enter the notebook title.");
            props.onDone({
              title: this.title,
              description: this.description,
              topics: this.state.topics
            });
          }
        }}
        negativeButton={{ text: "Cancel", onClick: props.close }}
      />
    );
  }
}
