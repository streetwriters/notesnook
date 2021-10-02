import React, { createRef } from 'react';
import { View } from 'react-native';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { db } from '../../utils/database';
import { eClosePendingDialog, eOpenPendingDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
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
    actionSheet.current?.setModalVisible(true);
    let u = await db.user.getUser();
    this.setState({
      user: u && u.Id ? u : null,
    });
  }

  close() {
    actionSheet.current?.setModalVisible(false);
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
      <ActionSheetWrapper fwdRef={actionSheet}>
        <View
          style={{
            width: '100%',
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
      </ActionSheetWrapper>
    );
  }
}

export default PendingDialog;
