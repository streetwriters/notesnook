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

import React, { createRef } from "react";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { eClosePremiumDialog, eOpenPremiumDialog } from "../../utils/events";
import BaseDialog from "../dialog/base-dialog";
import { PaywallComponent } from "./component";
import { IconButton } from "../ui/icon-button";

class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      promo: null
    };
    this.actionSheetRef = createRef();
  }

  componentDidMount() {
    eSubscribeEvent(eOpenPremiumDialog, this.open);
    eSubscribeEvent(eClosePremiumDialog, this.close);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOpenPremiumDialog, this.open);
    eUnSubscribeEvent(eClosePremiumDialog, this.close);
  }

  open = (promoInfo) => {
    this.setState({
      visible: true,
      promo: promoInfo
    });
  };

  close = () => {
    this.setState({
      visible: false,
      promo: null
    });
  };

  onClose = () => {
    this.setState({
      visible: false
    });
  };

  render() {
    return !this.state.visible ? null : (
      <BaseDialog
        animation="slide"
        bounce={false}
        background={this.props.colors.primary.background}
        onRequestClose={this.onClose}
      >
        <PaywallComponent
          getRef={() => this.actionSheetRef}
          promo={this.state.promo}
          close={this.close}
        />
      </BaseDialog>
    );
  }
}

export default PremiumDialog;
