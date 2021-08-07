import React, {createRef} from 'react';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {PremiumComponent} from './PremiumComponent';

class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      promo:null
    };
    this.actionSheetRef = createRef();
  }

  open(promoInfo) {
    console.log(promoInfo)
    this.setState(
      {
        visible: true,
        promo:promoInfo
      },
      () => {
        this.actionSheetRef.current?.setModalVisible(true);
      },
    );
  }

  close = () => {
    this.actionSheetRef.current?.setModalVisible(false);
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    return !this.state.visible ? null : (
      <ActionSheetWrapper onClose={this.onClose} fwdRef={this.actionSheetRef}>
        <PremiumComponent getRef={() => this.actionSheetRef}  promo={this.state.promo} close={this.close} />
      </ActionSheetWrapper>
    );
  }
}

export default PremiumDialog;
