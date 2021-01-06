import React, {createRef} from 'react';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {db} from '../../utils/DB';
import {
  eCloseAddTopicDialog,
  eOnNewTopicAdded,
  eOpenAddTopicDialog,
} from '../../utils/Events';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import {updateEvent} from '../DialogManager/recievers';
import Input from '../Input';
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
      await db.notebooks.notebook(this.notebook.id).topics.add(this.title);

    } else {
      let topic = this.props.toEdit;
      topic.title = this.title;

      await db.notebooks.notebook(topic.notebookId).topics.add(topic);
    }
    this.close();
    updateEvent({type: Actions.NOTEBOOKS});
    eSendEvent(eOnNewTopicAdded);
  };

  componentDidMount() {
    eSubscribeEvent(eOpenAddTopicDialog, this.open);
    eSubscribeEvent(eCloseAddTopicDialog, this.close);
  }
  componentWillUnmount() {
    eUnSubscribeEvent(eOpenAddTopicDialog, this.open);
    eUnSubscribeEvent(eCloseAddTopicDialog, this.close);
  }

  open = async (notebookId) => {
    let id = notebookId || this.props.notebookID;
    //console.log(notebookId)
    this.notebook = await db.notebooks.notebook(id).data
    this.setState({
      visible: true,
    });
  };
  close = () => {
    this.title = null;
    this.setState({
      visible: false,
    });
  };

  render() {
    const {visible} = this.state;
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

          <Input
            fwdRef={this.titleRef}
            onChangeText={(value) => {
              this.title = value;
            }}
            blurOnSubmit={false}
            defaultValue={toEdit ? toEdit.title : null}
            placeholder="Enter title of topic"
            onSubmit={this.addNewTopic}
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
