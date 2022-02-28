import React, { createRef } from 'react';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eClosePremiumDialog, eOpenPremiumDialog } from '../../utils/events';
import BaseDialog from '../dialog/base-dialog';
import { Component } from './component';

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

  open = promoInfo => {
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
        background={this.props.colors.bg}
        onRequestClose={this.onClose}
      >
        <Component getRef={() => this.actionSheetRef} promo={this.state.promo} close={this.close} />
      </BaseDialog>
    );
  }
}

export default PremiumDialog;
