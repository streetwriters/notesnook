import React, {createRef} from 'react';
import {View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {eOnNewTopicAdded} from '../../utils/Events';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import {updateEvent} from '../DialogManager/recievers';
import Seperator from '../Seperator';
import {Toast} from '../Toast';

export class AddTopicDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      titleFocused: false,
    };

    this.title;
    this.titleRef = createRef();
    this.notebook = null;
  }

  addNewTopic = async () => {
    if (!this.title)
      return ToastEvent.show('Title is required', 'error', 'local');

    if (!this.props.toEdit) {
      await db.notebooks.notebook(this.props.notebookID).topics.add(this.title);
    } else {
      let topic = this.props.toEdit;
      topic.title = this.title;

      await db.notebooks.notebook(topic.notebookId).topics.add(topic);
    }
    this.close();
    updateEvent({type: Actions.NOTEBOOKS});
    eSendEvent(eOnNewTopicAdded);
  };

  async open() {
    console.log(this.props.notebookID);
    this.notebook = await db.notebooks.notebook(this.props.notebookID);
    this.setState({
      visible: true,
    });
  }
  close = () => {
    this.title = null;
    this.setState({
      visible: false,
    });
  };

  render() {
    const {visible, titleFocused} = this.state;
    const {colors, toEdit} = this.props;
    if (!visible) return null;
    return (
      <BaseDialog
        onShow={() => {
          this.titleRef.current?.focus();
        }}
        statusBarTranslucent={false}
        visible={true}
        onRequestClose={this.close}>
        <DialogContainer>
          <DialogHeader
            icon="book-outline"
            title={toEdit ? 'Edit Topic' : 'New Topic'}
            paragraph={'Add a new topic to ' + this.notebook.title}
          />

          <TextInput
            ref={this.titleRef}
            style={{
              paddingTop: 10,
              paddingBottom: 5,
              borderBottomWidth: 1,
              borderColor: titleFocused ? colors.accent : colors.nav,
              paddingHorizontal: 0,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
            }}
            onFocus={() => {
              this.setState({
                titleFocused: true,
              });
            }}
            onBlur={() => {
              this.setState({
                titleFocused: true,
              });
            }}
            defaultValue={toEdit ? toEdit.title : null}
            onChangeText={(value) => {
              this.title = value;
            }}
            placeholder="Enter title of topic"
            placeholderTextColor={colors.icon}
          />

          <DialogButtons
            positiveTitle={toEdit ? 'Save' : 'Add'}
            onPressNegative={() => {
              this.title = null;
              this.setState({
                visible: false,
              });
            }}
            onPressPositive={this.addNewTopic}
          />
        </DialogContainer>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
