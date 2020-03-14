import React, {Component, createRef} from 'react';
import {View, Text, TouchableOpacity, Modal, ToastAndroid} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput} from 'react-native-gesture-handler';
import {db, DDS} from '../../../App';
import {getElevation, ToastEvent, editing} from '../../utils/utils';
import Share from 'react-native-share';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eOnLoadNote,
  eOpenVaultDialog,
  eCloseVaultDialog,
  refreshNotesPage,
} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
import {ACTIONS} from '../../provider/actions';
import {Toast} from '../Toast';
import {updateEvent} from '../DialogManager/recievers';

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
    console.log(goToEditor, 'goToEditor');
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
    updateEvent({type: ACTIONS.NOTES});

    this.setState({
      visible: false,
      note: {},
      locked: false,
      permanant: false,
      goToEditor: false,
      share: false,
      novault: false,
      deleteNote: false,
    });
  };

  onPress = async () => {
    if (!this.state.novault) {
      if (this.password.length < 3) {
        ToastEvent.show('Password too short', 'error', 'local');

        return;
      }
      if (
        this.password &&
        this.password.trim() !== 0 &&
        this.state.passwordsDontMatch
      ) {
        ToastEvent.show('Passwords do not match', 'error', 'local');

        return;
      } else {
        this._createVault();
      }
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
          .catch(e => {
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
      db.vault.add(this.state.note.id).then(e => {
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
      .then(async () => {
        if (this.state.goToEditor) {
          this._openInEditor(note);
        } else if (this.state.share) {
          this._shareNote(note);
        } else if (this.state.deleteNote) {
          await this._deleteNote();
        }
      })
      .catch(e => {
        this._takeErrorAction(e);
      });
  }
  async _deleteNote() {
    await db.notes.delete(this.state.note.id);
    updateEvent({type: ACTIONS.NOTES});
    updateEvent({type: ACTIONS.FAVORITES});
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
      .catch(e => {
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
      console.log('ERROR', e.message);
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
      <Modal
        onShow={() => {
          passInputRef.current?.focus();
        }}
        visible={visible}
        transparent={true}
        onRequestClose={this.close}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.night
              ? 'rgba(255,255,255,0.3)'
              : 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              ...getElevation(5),
              width: '80%',
              maxHeight: 350,
              borderRadius: 5,
              backgroundColor: colors.bg,
              paddingHorizontal: ph,
              paddingVertical: pv,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="shield" color={colors.accent} size={SIZE.lg} />
              <Text
                style={{
                  color: colors.accent,
                  fontFamily: WEIGHT.bold,
                  marginLeft: 5,
                  fontSize: SIZE.md,
                }}>
                {!novault
                  ? 'Create vault'
                  : note.locked
                  ? this.state.deleteNote
                    ? 'Delete note'
                    : this.state.share
                    ? 'Share note'
                    : this.state.goToEditor
                    ? 'Unlock note'
                    : 'Unlock note'
                  : 'Lock note'}
              </Text>
            </View>

            <Text
              style={{
                color: colors.icon,
                fontFamily: WEIGHT.regular,
                textAlign: 'center',
                fontSize: SIZE.sm - 1,
                flexWrap: 'wrap',
                maxWidth: '90%',
                alignSelf: 'center',
                marginTop: 10,
              }}>
              {!novault
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
                : 'Enter vault password to lock note.'}
            </Text>

            {note.locked || locked || permanant ? (
              <TextInput
                ref={passInputRef}
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: this.state.wrongPassword
                    ? colors.errorText
                    : colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  marginTop: 10,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                }}
                onChangeText={value => {
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
                  onChangeText={value => {
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
                  onChangeText={value => {
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

            <View
              style={{
                justifyContent: 'space-around',
                alignItems: 'center',
                flexDirection: 'row',
                marginTop: 20,
              }}>
              <TouchableOpacity
                activeOpacity={opacity}
                onPress={this.onPress}
                secureTextEntry
                style={{
                  paddingVertical: pv,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  width: '45%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderColor: colors.accent,
                  backgroundColor: colors.accent,
                  borderWidth: 1,
                }}>
                <Text
                  style={{
                    fontFamily: WEIGHT.medium,
                    color: 'white',
                    fontSize: SIZE.sm,
                  }}>
                  {note.locked
                    ? this.state.deleteNote
                      ? 'Delete'
                      : this.state.share
                      ? 'Share '
                      : this.state.goToEditor
                      ? 'Open'
                      : 'Unlock'
                    : 'Lock'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={opacity}
                onPress={this.close}
                style={{
                  paddingVertical: pv,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  width: '45%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.nav,
                }}>
                <Text
                  style={{
                    fontFamily: WEIGHT.medium,
                    color: colors.icon,
                    fontSize: SIZE.sm,
                  }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Toast context="local" />
      </Modal>
    );
  }
}
