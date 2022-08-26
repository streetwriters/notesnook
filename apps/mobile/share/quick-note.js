import React, { Component } from "react";
import { Appearance, SafeAreaView } from "react-native";
import RNBootSplash from "react-native-bootsplash";
import {
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT
} from "../app/utils/color-scheme";
import NotesnookShare from "./index";

export default class QuickNoteIOS extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      colors:
        Appearance.getColorScheme() === "dark"
          ? COLOR_SCHEME_DARK
          : COLOR_SCHEME_LIGHT,
      height: 0
    };
  }

  componentDidMount() {
    RNBootSplash.hide({ fade: true });
  }

  render() {
    return (
      <SafeAreaView
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "flex-start",
          backgroundColor: this.state.colors.nav
        }}
      >
        <NotesnookShare quicknote={true} />
      </SafeAreaView>
    );
  }
}
