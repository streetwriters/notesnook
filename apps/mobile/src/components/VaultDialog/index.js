import React, {Component, createRef} from 'react';
import {Modal, Text, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Actions} from '../../provider/Actions';
import {
    eSendEvent,
    eSubscribeEvent,
    eUnSubscribeEvent, ToastEvent,
} from '../../services/EventManager';
import {
  eCloseVaultDialog,
  eOnLoadNote,
  eOpenVaultDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {openEditorAnimation} from '../../utils/Animations';
import {getElevation} from '../../utils';
import {Button} from '../Button/index';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
import {updateEvent} from '../DialogManager/recievers';
import {Toast} from '../Toast';
import {ph, pv, SIZE, WEIGHT} from "../../utils/SizeUtils";
import {db} from "../../utils/DB";
import {DDS} from "../../services/DeviceDetection";
const passInputRef = createRef();
const confirmPassRef = createRef();

export class VaultDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      wrongPassword: false,
      note: {},
      vault: false,
      locked: true,
      permanant: false,
      goToEditor: false,
      share: false,
      passwordsDontMatch: false,
      deleteNote: false,
    };
    this.password = null;
    this.confirmPassword = null;
  }

  componentDidMount() {
    eSubscribeEvent(eOpenVaultDialog, this.open);
    eSubscribeEvent(eCloseVaultDialog, this.close);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOpenVaultDialog, this.open);
    eUnSubscribeEvent(eCloseVaultDialog, this.close);
  }

  open = ({
    item,
    novault,
    locked,
    permanant = false,
    goToEditor = false,
    share = false,
    deleteNote = false,
  }) => {
    this.setState({
      visible: true,
      note: item,
      novault: novault,
      locked,
      permanant,
      goToEditor,
      share,
      deleteNote,
    });
  };

  close = () => {
    updateEvent({type: Actions.NOTES});

    this.password = null;
    this.confirmPassword = null;
    this.setState({
      visible: false,
      note: {},
      locked: false,
      permanant: false,
      goToEditor: false,
      share: false,
      novault: false,
      deleteNote: false,
      passwordsDontMatch: false,
    });
  };

  onPress = async () => {
    if (!this.state.novault) {
      if (this.password.length < 3) {
        ToastEvent.show('Password too short', 'error', 'local');

        return;
      }
      if (this.password !== this.confirmPassword) {
        ToastEvent.show('Passwords do not match', 'error', 'local');
        this.setState({
          passwordsDontMatch: true,
        });
        return;
      }

      this._createVault();
    } else if (this.state.locked) {
      if (!this.password || this.password.trim() === 0) {
        ToastEvent.show('Password is invalid', 'error', 'local');
        this.setState({
          wrongPassword: true,
        });
        return;
      } else {
        db.vault
          .unlock(this.password)
          .then(async () => {
            this.setState({
              wrongPassword: false,
            });
            if (this.state.note.locked) {
              await this._unlockNote();
            } else {
              await this._lockNote();
            }
          })
          .catch((e) => {
            this._takeErrorAction(e);
          });
      }
    }
  };

  async _lockNote() {
    if (!this.password || this.password.trim() === 0) {
      ToastEvent.show('Password is invalid', 'error', 'local');
      return;
    } else {
      db.vault.add(this.state.note.id).then((e) => {
        this.close();
      });
    }
  }

  async _unlockNote() {
    if (!this.password || this.password.trim() === 0) {
      ToastEvent.show('Password is invalid', 'error', 'local');

      return;
    } else {
      if (this.state.permanant) {
        this._permanantUnlock();
      } else {
        await this._openNote();
      }
    }
  }

  async _openNote() {
    db.vault
      .open(this.state.note.id, this.password)
      .then(async (note) => {
        if (this.state.goToEditor) {
          this._openInEditor(note);
        } else if (this.state.share) {
          this._shareNote(note);
        } else if (this.state.deleteNote) {
          await this._deleteNote();
        }
      })
      .catch((e) => {
        this._takeErrorAction(e);
      });
  }
  async _deleteNote() {
    await db.notes.delete(this.state.note.id);
    updateEvent({type: Actions.NOTES});
    updateEvent({type: Actions.FAVORITES});
    eSendEvent(refreshNotesPage);
    this.close();
    ToastEvent.show('Note deleted', 'success', 'local');
  }

  async _createVault() {
    await db.vault.create(this.password);
    if (this.state.note && this.state.note.id && !this.state.note.locked) {
      await db.vault.add(this.state.note.id);
      this.close();
      ToastEvent.show('Note added to vault', 'success', 'local');
    }
  }

  _permanantUnlock() {
    db.vault
      .remove(this.state.note.id, this.password)
      .then(() => {
        this.close();
      })
      .catch((e) => {
        this._takeErrorAction(e);
      });
  }

  _openInEditor(note) {
    eSendEvent(eOnLoadNote, note);

    if (!DDS.isTab) {
      openEditorAnimation();
    }
    ToastEvent.show('Note unlocked', 'success');
    this.close();
  }

  _shareNote(note) {
    let m = `${note.title}\n \n ${note.content.text}`;
    Share.open({
      title: 'Share note to',
      failOnCancel: false,
      message: m,
    });
    this.close();
  }

  _takeErrorAction(e) {
    if (e.message === db.vault.ERRORS.wrongPassword) {
      ToastEvent.show('Password is incorrect', 'error', 'local');
      this.setState({
        wrongPassword: true,
      });
      return;
    } else {
    }
  }

  render() {
    const {colors} = this.props;
    const {
      note,
      visible,
      wrongPassword,
      passwordsDontMatch,
      novault,
      locked,
      permanant,
      goToEditor,
      share,
    } = this.state;

    return (
      <BaseDialog
        onShow={() => {
          passInputRef.current?.focus();
        }}
        onRequestClose={this.close}
        visible={visible}>
        <View
          style={{
            ...getElevation(5),
            width: DDS.isTab ? 350 : '80%',
            maxHeight: 350,
            borderRadius: 5,
            backgroundColor: colors.bg,
            paddingHorizontal: ph,
            paddingVertical: pv,
          }}>
          <DialogHeader
            title={
              !novault
                ? 'Create vault'
                : note.locked
                ? this.state.deleteNote
                  ? 'Delete note'
                  : this.state.share
                  ? 'Share note'
                  : this.state.goToEditor
                  ? 'Unlock note'
                  : 'Unlock note'
                : 'Lock note'
            }
            paragraph={
              !novault
                ? 'Set a password to create vault'
                : permanant
                ? 'Enter password to remove note from vault.'
                : note.locked
                ? this.state.deleteNote
                  ? 'Unlock note to delete it.'
                  : this.state.share
                  ? 'Unlock note to share it.'
                  : this.state.goToEditor
                  ? 'Unlock note to open it in editor'
                  : 'Enter vault password to unlock note.'
                : 'Enter vault password to lock note.'
            }
            icon="shield"
          />

          {note.locked || locked || permanant ? (
            <TextInput
              ref={passInputRef}
              style={{
                padding: pv - 5,
                borderWidth: 1.5,
                borderColor: wrongPassword ? colors.errorText : colors.nav,
                paddingHorizontal: ph,
                borderRadius: 5,
                marginTop: 10,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
              }}
              onChangeText={(value) => {
                this.password = value;
              }}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.icon}
            />
          ) : null}

          {!novault ? (
            <View>
              <TextInput
                ref={passInputRef}
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: passwordsDontMatch
                    ? colors.errorText
                    : colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                }}
                onChangeText={(value) => {
                  this.password = value;
                }}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor={colors.icon}
              />

              <TextInput
                ref={confirmPassRef}
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: passwordsDontMatch
                    ? colors.errorText
                    : colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                  marginTop: 10,
                }}
                secureTextEntry
                onChangeText={(value) => {
                  this.confirmPassword = value;
                  if (value !== this.password) {
                    this.setState({
                      passwordsDontMatch: true,
                    });
                  } else {
                    this.setState({
                      passwordsDontMatch: false,
                    });
                  }
                }}
                placeholder="Confirm password"
                placeholderTextColor={colors.icon}
              />
            </View>
          ) : null}

          <DialogButtons
            onPressNegative={this.close}
            onPressPositive={this.onPress}
            positiveTitle={
              note.locked
                ? this.state.deleteNote
                  ? 'Delete'
                  : this.state.share
                  ? 'Share '
                  : this.state.goToEditor
                  ? 'Open'
                  : 'Unlock'
                : 'Lock'
            }
          />
        </View>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
