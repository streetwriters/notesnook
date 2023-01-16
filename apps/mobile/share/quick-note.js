/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
