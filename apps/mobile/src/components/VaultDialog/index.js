import React, {Component, createRef} from 'react';
import {Platform} from 'react-native';
import {InteractionManager, TouchableOpacity, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import BiometricService from '../../services/BiometricService';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  sendNoteEditedEvent,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getElevation, toTXT} from '../../utils';
import {db} from '../../utils/database';
import {
  eClearEditor,
  eCloseActionSheet,
  eCloseVaultDialog,
  eOnLoadNote,
  eOpenVaultDialog
} from '../../utils/Events';
import {deleteItems} from '../../utils/functions';
import {tabBarRef} from '../../utils/Refs';
import {ph, SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {getNote} from '../../views/Editor/Functions';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import Seperator from '../Seperator';
import {Toast} from '../Toast';
import Paragraph from '../Typography/Paragraph';

let Keychain;
const passInputRef = createRef();
const confirmPassRef = createRef();
const changePassInputRef = createRef();
export class VaultDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      wrongPassword: false,
      loading: false,
      note: {},
      vault: false,
      locked: true,
      permanant: false,
      goToEditor: false,
      share: false,
      passwordsDontMatch: false,
      deleteNote: false,
      focusIndex: null,
      biometricUnlock: false,
      isBiometryEnrolled: false,
      isBiometryAvailable: false,
      fingerprintAccess: false,
      changePassword: false,
      copyNote: false,
      revokeFingerprintAccess: false,
      title: 'Unlock Note',
      description: null,
      clearVault: false,
      deleteVault: false,
      deleteAll: false
    };
    this.password = null;
    this.confirmPassword = null;
    this.newPassword = null;
    (this.title = !this.state.novault
      ? 'Create Vault'
      : this.state.fingerprintAccess
      ? 'Vault Fingerprint Unlock'
      : this.state.revokeFingerprintAccess
      ? 'Revoke Vault Fingerprint Unlock'
      : this.state.changePassword
      ? 'Change Vault Password'
      : this.state.note.locked
      ? this.state.deleteNote
        ? 'Delete note'
        : this.state.share
        ? 'Share note'
        : this.state.copyNote
        ? 'Copy note'
        : this.state.goToEditor
        ? 'Unlock note'
        : 'Unlock note'
      : 'Lock note'),
      (this.description = !this.state.novault
        ? 'Set a password to create vault'
        : this.state.fingerprintAccess
        ? 'Enter vault password to enable fingerprint unlocking.'
        : this.state.revokeFingerprintAccess
        ? 'Disable vault fingerprint unlock '
        : this.state.changePassword
        ? 'Setup a new password for the vault.'
        : this.state.permanant
        ? 'Enter password to remove note from vault.'
        : this.state.note.locked
        ? this.state.deleteNote
          ? 'Unlock note to delete it. If biometrics are not working, you can enter device pin to unlock vault.'
          : this.state.share
          ? 'Unlock note to share it. If biometrics are not working, you can enter device pin to unlock vault.'
          : this.state.copyNote
          ? 'Unlock note to copy it. If biometrics are not working, you can enter device pin to unlock vault.'
          : this.state.goToEditor
          ? 'Unlock note to open it in editor. If biometrics are not working, you can enter device pin to unlock vault.'
          : 'Enter vault password to unlock note. If biometrics are not working, you can enter device pin to unlock vault.'
        : 'Enter vault password to lock note. If biometrics are not working, you can enter device pin to lock note.');
  }

  componentDidMount() {
    eSubscribeEvent(eOpenVaultDialog, this.open);
    eSubscribeEvent(eCloseVaultDialog, this.close);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOpenVaultDialog, this.open);
    eUnSubscribeEvent(eCloseVaultDialog, this.close);
  }

  /**
   *
   * @param {import('../../services/EventManager').vaultType} data
   */
  open = async data => {
    if (!Keychain) {
      Keychain = require('react-native-keychain');
    }
    let biometry = await BiometricService.isBiometryAvailable();
    let available = false;
    let fingerprint = await BiometricService.hasInternetCredentials('nn_vault');

    if (biometry) {
      available = true;
    }

    this.setState({
      note: data.item,
      novault: data.novault,
      locked: data.locked,
      permanant: data.permanant,
      goToEditor: data.goToEditor,
      share: data.share,
      deleteNote: data.deleteNote,
      copyNote: data.copyNote,
      isBiometryAvailable: available,
      biometricUnlock: fingerprint,
      isBiometryEnrolled: fingerprint,
      fingerprintAccess: data.fingerprintAccess,
      changePassword: data.changePassword,
      revokeFingerprintAccess: data.revokeFingerprintAccess,
      title: data.title,
      description: data.description,
      clearVault: data.clearVault,
      deleteVault: data.deleteVault
    });

    if (
      fingerprint &&
      data.novault &&
      !data.fingerprintAccess &&
      !data.revokeFingerprintAccess &&
      !data.changePassword &&
      !data.clearVault &&
      !data.deleteVault
    ) {
      await this._onPressFingerprintAuth(data.title, data.description);
    } else {
      this.setState({
        visible: true
      });
    }
  };

  close = () => {
    if (this.state.loading) {
      ToastEvent.show({
        heading: this.state.title,
        message: 'Please wait and do not close the app.',
        type: 'success',
        context: 'local'
      });
      return;
    }
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notes,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Notebook
    ]);
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
      passwordsDontMatch: false
    });
  };

  onPress = async () => {
    if (this.state.revokeFingerprintAccess) {
      await this._revokeFingerprintAccess();

      this.close();
      return;
    }
    if (this.state.loading) return;

    if (!this.password) {
      ToastEvent.show({
        heading: 'Password not entered',
        message: 'Enter a password for the vault and try again.',
        type: 'error',
        context: 'local'
      });
      return;
    }
    if (this.password && this.password.length < 3) {
      ToastEvent.show({
        heading: 'Password too short',
        message: 'Password must be longer than 3 characters.',
        type: 'error',
        context: 'local'
      });

      return;
    }

    if (!this.state.novault) {
      if (this.password !== this.confirmPassword) {
        ToastEvent.show({
          heading: 'Passwords do not match',
          type: 'error',
          context: 'local'
        });
        this.setState({
          passwordsDontMatch: true
        });
        return;
      }

      this._createVault();
    } else if (this.state.changePassword) {
      this.setState({
        loading: true
      });

      db.vault
        .changePassword(this.password, this.newPassword)
        .then(result => {
          this.setState({
            loading: false
          });
          if (this.state.biometricUnlock) {
            this._enrollFingerprint(this.newPassword);
          }
          ToastEvent.show({
            heading: 'Vault password updated successfully',
            type: 'success',
            context: 'global'
          });
          this.close();
        })
        .catch(e => {
          this.setState({
            loading: false
          });
          if (e.message === db.vault.ERRORS.wrongPassword) {
            ToastEvent.show({
              heading: 'Incorrect password',
              message: 'Please enter the correct password and try again',
              type: 'error',
              context: 'local'
            });
          }
        });
    } else if (this.state.locked) {
      if (!this.password || this.password.trim() === 0) {
        ToastEvent.show({
          heading: 'Incorrect password',
          message: 'Please enter the correct password and try again',
          type: 'error',
          context: 'local'
        });
        this.setState({
          wrongPassword: true
        });
        return;
      }
      db.vault
        .unlock(this.password)
        .then(async () => {
          this.setState({
            wrongPassword: false
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
    } else if (this.state.fingerprintAccess) {
      this._enrollFingerprint(this.password);
    } else if (this.state.clearVault) {
      await this.clearVault();
    } else if (this.state.deleteVault) {
      await this.deleteVault();
    }
  };

  deleteVault = async () => {
    this.setState({
      loading: true
    });
    try {
      let verified = await db.user.verifyPassword(this.password);
      if (verified) {
        await db.vault.delete(this.state.deleteAll);
        eSendEvent('vaultUpdated');
        this.setState({
          loading: false
        });
        this.close();
      } else {
        ToastEvent.show({
          heading: 'Account password incorrect',
          message: 'Please enter correct password for your account.',
          type: 'error',
          context: 'local'
        });
      }
    } catch (e) {}
    this.setState({
      loading: false
    });
  };

  clearVault = async () => {
    this.setState({
      loading: true
    });
    try {
      await db.vault.clear(this.password);
      this.setState({
        loading: false
      });
      this.close();
      eSendEvent('vaultUpdated');
    } catch (e) {
      ToastEvent.show({
        heading: 'Vault password incorrect',
        message: 'Please enter correct password to clear vault.',
        type: 'error',
        context: 'local'
      });
    }
    this.setState({
      loading: false
    });
  };

  async _lockNote() {
    if (!this.password || this.password.trim() === 0) {
      ToastEvent.show({
        message: 'Incorrect password',
        message: 'Please enter the correct password and try again',
        type: 'error',
        context: 'local'
      });
      console.log('returning from here');
      return;
    } else {
      await db.vault.add(this.state.note.id);
      if (this.state.note.id === getNote()?.id) {
        eSendEvent(eClearEditor);
      }
      this.close();
      ToastEvent.show({
        message: 'Note locked successfully',
        type: 'error',
        context: 'local'
      });
      this.setState({
        loading: false
      });
    }
  }

  async _unlockNote() {
    if (!this.password || this.password.trim() === 0) {
      ToastEvent.show({
        heading: 'Incorrect password',
        message: 'Please enter the correct password and try again',
        type: 'error',
        context: 'local'
      });
      return;
    }
    if (this.state.permanant) {
      this._permanantUnlock();
    } else {
      await this._openNote();
    }
  }

  _openNote = async () => {
    try {
      let note = await db.vault.open(this.state.note.id, this.password);
      if (this.state.biometricUnlock && !this.state.isBiometryEnrolled) {
        await this._enrollFingerprint(this.password);
      }
      if (this.state.goToEditor) {
        this._openInEditor(note);
      } else if (this.state.share) {
        await this._shareNote(note);
      } else if (this.state.deleteNote) {
        await this._deleteNote();
      } else if (this.state.copyNote) {
        this._copyNote(note);
      }
    } catch (e) {
      this._takeErrorAction(e);
    }
  };
  async _deleteNote() {
    try {
      await db.vault.remove(this.state.note.id, this.password);
      await deleteItems(this.state.note);
      this.close();
    } catch (e) {
      this._takeErrorAction(e);
    }
  }

  async _enrollFingerprint(password) {
    try {
      this.setState(
        {
          loading: true
        },
        async () => {
          try {
            await db.vault.unlock(password);
            await BiometricService.storeCredentials(password);
            this.setState({
              loading: false
            });
            eSendEvent('vaultUpdated');
            ToastEvent.show({
              heading: 'Biometric unlocking enabled!',
              message: 'Now you can unlock notes in vault with biometrics.',
              type: 'success',
              context: 'global'
            });
            this.close();
          } catch (e) {
            ToastEvent.show({
              heading: 'Incorrect password',
              message:
                'Please enter the correct vault password to enable biometrics.',
              type: 'error',
              context: 'local'
            });
            this.setState({
              loading: false
            });
            return;
          }
        }
      );
    } catch (e) {
      this._takeErrorAction(e);
    }
  }

  async _createVault() {
    await db.vault.create(this.password);

    if (this.state.biometricUnlock) {
      await this._enrollFingerprint(this.password);
    }
    if (this.state.note?.id) {
      await db.vault.add(this.state.note.id);
      if (this.state.note.id === getNote()?.id) {
        eSendEvent(eClearEditor);
      }
      this.setState({
        loading: false
      });
      ToastEvent.show({
        heading: 'Note added to vault',
        type: 'success',
        context: 'global'
      });
      this.close();
    } else {
      eSendEvent('vaultUpdated');
      ToastEvent.show({
        heading: 'Vault created successfully',
        type: 'success',
        context: 'global'
      });
      this.close();
    }
  }

  _permanantUnlock() {
    db.vault
      .remove(this.state.note.id, this.password)
      .then(r => {
        ToastEvent.show({
          heading: 'Note permanantly unlocked.',
          type: 'success',
          context: 'global'
        });
        this.close();
      })
      .catch(e => {
        this._takeErrorAction(e);
      });
  }

  _openInEditor(note) {
    this.close();
    InteractionManager.runAfterInteractions(() => {
      eSendEvent(eOnLoadNote, note);
      if (!DDS.isTab) {
        tabBarRef.current?.goToPage(1);
      }
    });
  }

  _copyNote(note) {
    let text = toTXT(note.content.data);
    text = `${note.title}\n \n ${text}`;
    console.log(text, 'TEXT');
    Clipboard.setString(text);
    Toast.show({
      heading: 'Note copied',
      type: 'success',
      message: 'Note has been copied to clipboard!',
      context: 'global'
    });
    this.close();
  }

  async _shareNote(note) {
    this.close();
    let text = toTXT(note.content.data);
    text = `${note.title}\n \n ${text}`;
    try {
      await Share.open({
        heading: 'Share note',
        failOnCancel: false,
        message: text
      });
    } catch (e) {}
  }

  _takeErrorAction(e) {
    if (e.message === db.vault.ERRORS.wrongPassword) {
      this.setState({
        wrongPassword: true,
        visible: true
      });
      setTimeout(() => {
        ToastEvent.show({
          heading: 'Incorrect password',
          type: 'error',
          context: 'local'
        });
      }, 500);

      return;
    }
  }

  _revokeFingerprintAccess = async () => {
    try {
      await BiometricService.resetCredentials();
      eSendEvent('vaultUpdated');
      ToastEvent.show({
        heading: 'Biometric unlocking disabled!',
        type: 'success',
        context: 'global'
      });
    } catch (e) {
      ToastEvent.show({
        heading: 'Failed to disable Biometric unlocking.',
        message: e.message,
        type: 'success',
        context: 'global'
      });
    }
  };

  _onPressFingerprintAuth = async (title, description) => {
    try {
      let credentials = await BiometricService.getCredentials(
        title || this.state.title,
        description || this.state.description
      );

      if (credentials?.password) {
        this.password = credentials.password;
        this.onPress();
      } else {
        eSendEvent(eCloseActionSheet);
        await sleep(300);
        this.setState({
          visible: true
        });
      }
    } catch (e) {}
  };

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
      biometricUnlock,
      deleteNote,
      share,
      goToEditor,
      fingerprintAccess,
      changePassword,
      copyNote,
      loading,
      deleteVault,
      clearVault
    } = this.state;

    if (!visible) return null;
    return (
      <BaseDialog
        onShow={async () => {
          await sleep(100);
          passInputRef.current?.focus();
        }}
        statusBarTranslucent={false}
        onRequestClose={this.close}
        visible={true}>
        <View
          style={{
            ...getElevation(5),
            width: DDS.isTab ? 350 : '85%',
            borderRadius: 10,
            backgroundColor: colors.bg,
            paddingTop: 12
          }}>
          <DialogHeader
            title={this.state.title}
            paragraph={this.state.description}
            icon="shield"
            padding={12}
          />
          <Seperator half />

          <View
            style={{
              paddingHorizontal: 12
            }}>
            {(novault ||
              changePassword ||
              this.state.clearVault ||
              this.state.deleteVault) &&
            !this.state.revokeFingerprintAccess ? (
              <>
                <Input
                  fwdRef={passInputRef}
                  editable={!loading}
                  autoCapitalize="none"
                  testID={notesnook.ids.dialogs.vault.pwd}
                  onChangeText={value => {
                    this.password = value;
                  }}
                  marginBottom={
                    !this.state.biometricUnlock ||
                    !this.state.isBiometryEnrolled ||
                    !novault ||
                    changePassword
                      ? 0
                      : 10
                  }
                  onSubmit={() => {
                    changePassword
                      ? changePassInputRef.current?.focus()
                      : this.onPress;
                  }}
                  autoCompleteType="password"
                  returnKeyLabel={changePassword ? 'Next' : this.state.title}
                  returnKeyType={changePassword ? 'next' : 'done'}
                  secureTextEntry
                  placeholder={changePassword ? 'Current password' : 'Password'}
                />

                {!this.state.biometricUnlock ||
                !this.state.isBiometryEnrolled ||
                !novault ||
                changePassword ? null : (
                  <Button
                    onPress={() =>
                      this._onPressFingerprintAuth('Unlock note', '')
                    }
                    icon="fingerprint"
                    width="100%"
                    title={'Biometric unlock'}
                    type="transparent"
                  />
                )}
              </>
            ) : null}

            {this.state.deleteVault && (
              <Button
                onPress={() =>
                  this.setState({
                    deleteAll: !this.state.deleteAll
                  })
                }
                icon={
                  this.state.deleteAll
                    ? 'check-circle-outline'
                    : 'checkbox-blank-circle-outline'
                }
                style={{
                  marginTop: 10
                }}
                width="100%"
                title={'Delete all notes'}
                type="errorShade"
              />
            )}

            {changePassword ? (
              <>
                <Seperator half />
                <Input
                  ref={changePassInputRef}
                  editable={!loading}
                  testID={notesnook.ids.dialogs.vault.changePwd}
                  autoCapitalize="none"
                  onChangeText={value => {
                    this.newPassword = value;
                  }}
                  autoCompleteType="password"
                  onSubmit={this.onPress}
                  returnKeyLabel="Change"
                  returnKeyType="done"
                  secureTextEntry
                  placeholder={'New password'}
                />
              </>
            ) : null}

            {!novault ? (
              <View>
                <Input
                  fwdRef={passInputRef}
                  autoCapitalize="none"
                  testID={notesnook.ids.dialogs.vault.pwd}
                  onChangeText={value => {
                    this.password = value;
                  }}
                  autoCompleteType="password"
                  returnKeyLabel="Next"
                  returnKeyType="next"
                  secureTextEntry
                  onSubmit={() => {
                    confirmPassRef.current?.focus();
                  }}
                  placeholder="Password"
                />

                <Input
                  fwdRef={confirmPassRef}
                  autoCapitalize="none"
                  testID={notesnook.ids.dialogs.vault.pwdAlt}
                  secureTextEntry
                  validationType="confirmPassword"
                  customValidator={() => this.password}
                  errorMessage="Passwords do not match."
                  onErrorCheck={e => null}
                  marginBottom={0}
                  autoCompleteType="password"
                  returnKeyLabel="Create"
                  returnKeyType="done"
                  onChangeText={value => {
                    this.confirmPassword = value;
                    if (value !== this.password) {
                      this.setState({
                        passwordsDontMatch: true
                      });
                    } else {
                      this.setState({
                        passwordsDontMatch: false
                      });
                    }
                  }}
                  onSubmit={this.onPress}
                  placeholder="Confirm password"
                />
              </View>
            ) : null}

            {this.state.biometricUnlock &&
            !this.state.isBiometryEnrolled &&
            novault ? (
              <Paragraph>
                Unlock with password once to enable biometric access.
              </Paragraph>
            ) : null}

            {this.state.isBiometryAvailable &&
            !this.state.fingerprintAccess &&
            !this.state.clearVault &&
            !this.state.deleteVault &&
            ((!this.state.biometricUnlock && !changePassword) || !novault) ? (
              <Button
                onPress={() => {
                  console.log(this.state.biometricUnlock);
                  this.setState({
                    biometricUnlock: !this.state.biometricUnlock
                  });
                }}
                style={{
                  marginTop: 10
                }}
                icon="fingerprint"
                width="100%"
                title="Biometric unlocking"
                type={this.state.biometricUnlock ? 'transparent' : 'gray'}
              />
            ) : null}
          </View>

          <DialogButtons
            onPressNegative={this.close}
            onPressPositive={this.onPress}
            loading={loading}
            positiveType={
              deleteVault || clearVault ? 'errorShade' : 'transparent'
            }
            positiveTitle={
              deleteVault
                ? 'Delete'
                : clearVault
                ? 'Clear'
                : fingerprintAccess
                ? 'Enable'
                : this.state.revokeFingerprintAccess
                ? 'Revoke'
                : changePassword
                ? 'Change'
                : note.locked
                ? deleteNote
                  ? 'Delete'
                  : share
                  ? 'Share '
                  : goToEditor
                  ? 'Open'
                  : 'Unlock'
                : !note.id
                ? 'Create'
                : 'Lock'
            }
          />
        </View>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
