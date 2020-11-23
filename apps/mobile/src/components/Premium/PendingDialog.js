import React, { createRef } from 'react';
import { View } from 'react-native';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { dWidth } from '../../utils';
import { db } from '../../utils/DB';
import { eClosePendingDialog, eOpenPendingDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import ActionSheet from '../ActionSheet';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const actionSheet = createRef();
class PendingDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      product: null,
    };
  }

  async open() {
    actionSheet.current?._setModalVisible(true);
    let u = await db.user.get();
    this.setState({
      user: u && u.Id ? u : null,
    });
  }

  close() {
    actionSheet.current?._setModalVisible(false);
    this.setState({
      user: null,
    });
  }
  async componentDidMount() {
      eSubscribeEvent(eOpenPendingDialog, this.open.bind(this));
      eSubscribeEvent(eClosePendingDialog, this.close.bind(this));  
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOpenPendingDialog, this.open);
    eUnSubscribeEvent(eClosePendingDialog, this.close);
  }

  render() {
    const {colors} = this.props;
    return (
      <ActionSheet
        containerStyle={{
          backgroundColor: colors.bg,
          alignSelf: 'center',
          width: DDS.isTab ? 500 : '100%',
          borderRadius: 10,
          marginBottom: DDS.isTab ? 50 : 0,
        }}
        extraScroll={DDS.isTab ? 50 : 0}
        gestureEnabled={true}
        footerAlwaysVisible={DDS.isTab}
        footerHeight={DDS.isTab ? 20 : 10}
        footerStyle={
          DDS.isTab
            ? {
                borderRadius: 10,
                backgroundColor: colors.bg,
              }
            : null
        }
        ref={actionSheet}
        initialOffsetFromBottom={1}>
        <View
          style={{
            width: DDS.isTab ? 500 : dWidth,
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <Heading
            size={SIZE.xxxl}
            color={colors.accent}
            style={{
              paddingBottom: 20,
              paddingTop: 10,
              alignSelf: 'center',
            }}>
            Thank you!
          </Heading>

          <Seperator />

          <Paragraph
            size={SIZE.md}
            style={{
              fontSize: SIZE.md,
              width: '80%',
              alignSelf: 'center',
              textAlign: 'center',
            }}>
            We are processing your subscription. You account will be upgraded to
            Notesnook Pro very soon.
          </Paragraph>
          <Seperator />
        </View>
      </ActionSheet>
    );
  }
}

export default PendingDialog;
