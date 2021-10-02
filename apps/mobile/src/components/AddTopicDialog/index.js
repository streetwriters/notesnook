import React, {createRef} from 'react';
import {Actions} from '../../provider/Actions';
import {useMenuStore} from '../../provider/stores';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/database';
import {eCloseAddTopicDialog, eOpenAddTopicDialog} from '../../utils/Events';
import {sleep} from '../../utils/TimeUtils';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import {updateEvent} from '../DialogManager/recievers';
import Input from '../Input';
import Seperator from '../Seperator';
import {Toast} from '../Toast';

export class AddTopicDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      titleFocused: false,
      loading: false
    };

    this.title;
    this.titleRef = createRef();
    this.notebook = null;
    this.toEdit = null;
  }

  addNewTopic = async () => {
    try {
      this.setState({loading: true});
      if (!this.title || this.title?.trim() === '') {
        ToastEvent.show({
          heading: 'Topic title is required',
          type: 'error',
          context: 'local'
        });
        this.setState({loading: false});
        return;
      }

      if (!this.toEdit) {
        await db.notebooks.notebook(this.notebook.id).topics.add(this.title);
      } else {
        let topic = this.toEdit;
        topic.title = this.title;

        await db.notebooks.notebook(topic.notebookId).topics.add(topic);
      }
      this.setState({loading: false});
      this.close();
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notebooks,
        Navigation.routeNames.Notebook,
        Navigation.routeNames.NotesPage
      ]);
      useMenuStore.getState().setMenuPins();
    } catch (e) {}
  };

  componentDidMount() {
    eSubscribeEvent(eOpenAddTopicDialog, this.open);
    eSubscribeEvent(eCloseAddTopicDialog, this.close);
  }
  componentWillUnmount() {
    eUnSubscribeEvent(eOpenAddTopicDialog, this.open);
    eUnSubscribeEvent(eCloseAddTopicDialog, this.close);
  }

  open = async ({notebookId, toEdit}) => {
    let id = notebookId;
    if (id) {
      this.notebook = await db.notebooks.notebook(id).data;
    }
    this.toEdit = toEdit;

    if (this.toEdit) {
      this.title = this.toEdit.title;
    }

    this.setState({
      visible: true
    });
  };
  close = () => {
    this.props.close();
    this.title = null;
    this.notebook = null;
    this.toEdit = null;
    this.setState({
      visible: false
    });
  };

  render() {
    const {visible} = this.state;
    if (!visible) return null;
    return (
      <BaseDialog
        onShow={async () => {
          await sleep(300);
          this.titleRef.current?.focus();
        }}
        statusBarTranslucent={false}
        visible={true}
        onRequestClose={this.close}>
        <DialogContainer>
          <DialogHeader
            icon="book-outline"
            title={this.toEdit ? 'Edit Topic' : 'New Topic'}
            paragraph={
              this.toEdit
                ? 'Edit title of the topic'
                : 'Add a new topic to ' + this.notebook.title
            }
          />
          <Seperator half />
          <Input
            fwdRef={this.titleRef}
            onChangeText={value => {
              this.title = value;
            }}
            blurOnSubmit={false}
            defaultValue={this.toEdit ? this.toEdit.title : null}
            placeholder="Enter title of topic"
            onSubmit={() => this.addNewTopic()}
            returnKeyLabel="Done"
            returnKeyType="done"
          />

          <DialogButtons
            positiveTitle={this.toEdit ? 'Save' : 'Add'}
            onPressNegative={() => this.close()}
            onPressPositive={() => this.addNewTopic()}
            loading={this.state.loading}
          />
        </DialogContainer>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
