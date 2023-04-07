/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Clipboard from "@react-native-clipboard/clipboard";
import React, { Component, createRef } from "react";
import { InteractionManager, View } from "react-native";
import Share from "react-native-share";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { editorController } from "../../../screens/editor/tiptap/utils";
import BiometricService from "../../../services/biometrics";
import { DDS } from "../../../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import SearchService from "../../../services/search";
import { getElevation, toTXT } from "../../../utils";
import {
  eClearEditor,
  eCloseActionSheet,
  eCloseVaultDialog,
  eOnLoadNote,
  eOpenVaultDialog
} from "../../../utils/events";
import { deleteItems } from "../../../utils/functions";
import { tabBarRef } from "../../../utils/global-refs";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import DialogButtons from "../../dialog/dialog-buttons";
import DialogHeader from "../../dialog/dialog-header";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import Paragraph from "../../ui/typography/paragraph";

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
      title: "Unlock Note",
      description: null,
      clearVault: false,
      deleteVault: false,
      deleteAll: false
    };
    this.password = null;
    this.confirmPassword = null;
    this.newPassword = null;
    (this.title = !this.state.novault
      ? "Create Vault"
      : this.state.fingerprintAccess
      ? "Vault Fingerprint Unlock"
      : this.state.revokeFingerprintAccess
      ? "Revoke Vault Fingerprint Unlock"
      : this.state.changePassword
      ? "Change Vault Password"
      : this.state.note.locked
      ? this.state.deleteNote
        ? "Delete note"
        : this.state.share
        ? "Share note"
        : this.state.copyNote
        ? "Copy note"
        : this.state.goToEditor
        ? "Unlock note"
        : "Unlock note"
      : "Lock note"),
      (this.description = !this.state.novault
        ? "Set a password to create vault"
        : this.state.fingerprintAccess
        ? "Enter vault password to enable fingerprint unlocking."
        : this.state.revokeFingerprintAccess
        ? "Disable vault fingerprint unlock "
        : this.state.changePassword
        ? "Setup a new password for the vault."
        : this.state.permanant
        ? "Enter password to remove note from vault."
        : this.state.note.locked
        ? this.state.deleteNote
          ? "Unlock note to delete it. If biometrics are not working, you can enter device pin to unlock vault."
          : this.state.share
          ? "Unlock note to share it. If biometrics are not working, you can enter device pin to unlock vault."
          : this.state.copyNote
          ? "Unlock note to copy it. If biometrics are not working, you can enter device pin to unlock vault."
          : this.state.goToEditor
          ? "Unlock note to open it in editor. If biometrics are not working, you can enter device pin to unlock vault."
          : "Enter vault password to unlock note. If biometrics are not working, you can enter device pin to unlock vault."
        : "Enter vault password to lock note. If biometrics are not working, you can enter device pin to lock note.");
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
   * @param {import('../../../services/event-manager').vaultType} data
   */
  open = async (data) => {
    if (!Keychain) {
      Keychain = require("react-native-keychain");
    }
    let biometry = await BiometricService.isBiometryAvailable();
    let available = false;
    let fingerprint = await BiometricService.hasInternetCredentials("nn_vault");

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
        message: "Please wait and do not close the app.",
        type: "success",
        context: "local"
      });
      return;
    }

    Navigation.queueRoutesForUpdate();

    this.password = null;
    this.confirmPassword = null;
    SearchService.updateAndSearch();
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
        heading: "Password not entered",
        message: "Enter a password for the vault and try again.",
        type: "error",
        context: "local"
      });
      return;
    }
    if (this.password && this.password.length < 3) {
      ToastEvent.show({
        heading: "Password too short",
        message: "Password must be longer than 3 characters.",
        type: "error",
        context: "local"
      });

      return;
    }

    if (!this.state.novault) {
      if (this.password !== this.confirmPassword) {
        ToastEvent.show({
          heading: "Passwords do not match",
          type: "error",
          context: "local"
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
        .then(() => {
          this.setState({
            loading: false
          });
          if (this.state.biometricUnlock) {
            this._enrollFingerprint(this.newPassword);
          }
          ToastEvent.show({
            heading: "Vault password updated successfully",
            type: "success",
            context: "global"
          });
          this.close();
        })
        .catch((e) => {
          this.setState({
            loading: false
          });
          if (e.message === db.vault.ERRORS.wrongPassword) {
            ToastEvent.show({
              heading: "Incorrect password",
              message: "Please enter the correct password and try again",
              type: "error",
              context: "local"
            });
          }
        });
    } else if (this.state.locked) {
      if (!this.password || this.password.trim() === 0) {
        ToastEvent.show({
          heading: "Incorrect password",
          message: "Please enter the correct password and try again",
          type: "error",
          context: "local"
        });
        this.setState({
          wrongPassword: true
        });
        return;
      }
      if (this.state.note.locked) {
        await this._unlockNote();
      } else {
        db.vault
          .unlock(this.password)
          .then(async () => {
            this.setState({
              wrongPassword: false
            });
            await this._lockNote();
          })
          .catch((e) => {
            this._takeErrorAction(e);
          });
      }
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
      if (!(await db.user.getUser())) verified = true;
      if (verified) {
        await db.vault.delete(this.state.deleteAll);
        eSendEvent("vaultUpdated");
        this.setState({
          loading: false
        });
        this.close();
      } else {
        ToastEvent.show({
          heading: "Account password incorrect",
          message: "Please enter correct password for your account.",
          type: "error",
          context: "local"
        });
      }
    } catch (e) {
      console.error(e);
    }
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
      eSendEvent("vaultUpdated");
    } catch (e) {
      ToastEvent.show({
        heading: "Vault password incorrect",
        message: "Please enter correct password to clear vault.",
        type: "error",
        context: "local"
      });
    }
    this.setState({
      loading: false
    });
  };

  async _lockNote() {
    if (!this.password || this.password.trim() === 0) {
      ToastEvent.show({
        heading: "Incorrect password",
        type: "error",
        context: "local"
      });
      return;
    } else {
      await db.vault.add(this.state.note.id);
      if (this.state.note.id === editorController.current?.note?.id) {
        eSendEvent(eClearEditor);
      }
      this.close();
      ToastEvent.show({
        message: "Note locked successfully",
        type: "error",
        context: "local"
      });
      this.setState({
        loading: false
      });
    }
  }

  async _unlockNote() {
    if (!this.password || this.password.trim() === 0) {
      ToastEvent.show({
        heading: "Incorrect password",
        message: "Please enter the correct password and try again",
        type: "error",
        context: "local"
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
        await this._copyNote(note);
      }
    } catch (e) {
      console.log(e);
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
            eSendEvent("vaultUpdated");
            ToastEvent.show({
              heading: "Biometric unlocking enabled!",
              message: "Now you can unlock notes in vault with biometrics.",
              type: "success",
              context: "global"
            });
            this.close();
          } catch (e) {
            ToastEvent.show({
              heading: "Incorrect password",
              message:
                "Please enter the correct vault password to enable biometrics.",
              type: "error",
              context: "local"
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
      if (this.state.note.id === editorController.current?.note?.id) {
        eSendEvent(eClearEditor);
      }
      this.setState({
        loading: false
      });
      ToastEvent.show({
        heading: "Note added to vault",
        type: "success",
        context: "global"
      });
      this.close();
    } else {
      eSendEvent("vaultUpdated");
      ToastEvent.show({
        heading: "Vault created successfully",
        type: "success",
        context: "global"
      });
      this.close();
    }
  }

  _permanantUnlock() {
    db.vault
      .remove(this.state.note.id, this.password)
      .then(() => {
        ToastEvent.show({
          heading: "Note permanantly unlocked.",
          type: "success",
          context: "global"
        });
        this.close();
      })
      .catch((e) => {
        this._takeErrorAction(e);
      });
  }

  _openInEditor(note) {
    this.close();
    InteractionManager.runAfterInteractions(async () => {
      eSendEvent(eOnLoadNote, note);
      if (!DDS.isTab) {
        tabBarRef.current?.goToPage(1);
      }
    });
  }

  async _copyNote(note) {
    Clipboard.setString(await toTXT(note));
    ToastEvent.show({
      heading: "Note copied",
      type: "success",
      message: "Note has been copied to clipboard!",
      context: "global"
    });
    this.close();
  }

  async _shareNote(note) {
    this.close();
    try {
      await Share.open({
        heading: "Share note",
        failOnCancel: false,
        message: await toTXT(note)
      });
    } catch (e) {
      console.error(e);
    }
  }

  _takeErrorAction(e) {
    if (
      e.message === db.vault.ERRORS.wrongPassword ||
      e.message === "FAILURE"
    ) {
      this.setState({
        wrongPassword: true,
        visible: true
      });
      setTimeout(() => {
        ToastEvent.show({
          heading: "Incorrect password",
          type: "error",
          context: "local"
        });
      }, 500);

      return;
    }
  }

  _revokeFingerprintAccess = async () => {
    try {
      await BiometricService.resetCredentials();
      eSendEvent("vaultUpdated");
      ToastEvent.show({
        heading: "Biometric unlocking disabled!",
        type: "success",
        context: "global"
      });
    } catch (e) {
      ToastEvent.show({
        heading: "Failed to disable Biometric unlocking.",
        message: e.message,
        type: "success",
        context: "global"
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
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    const { colors } = this.props;
    const {
      note,
      visible,
      novault,
      deleteNote,
      share,
      goToEditor,
      fingerprintAccess,
      changePassword,
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
        visible={true}
      >
        <View
          style={{
            ...getElevation(5),
            width: DDS.isTab ? 350 : "85%",
            borderRadius: 10,
            backgroundColor: colors.bg,
            paddingTop: 12
          }}
        >
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
            }}
          >
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
                  onChangeText={(value) => {
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
                  autoComplete="password"
                  returnKeyLabel={changePassword ? "Next" : this.state.title}
                  returnKeyType={changePassword ? "next" : "done"}
                  secureTextEntry
                  placeholder={changePassword ? "Current password" : "Password"}
                />

                {!this.state.biometricUnlock ||
                !this.state.isBiometryEnrolled ||
                !novault ||
                changePassword ? null : (
                  <Button
                    onPress={() =>
                      this._onPressFingerprintAuth("Unlock note", "")
                    }
                    icon="fingerprint"
                    width="100%"
                    title={"Biometric unlock"}
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
                    ? "check-circle-outline"
                    : "checkbox-blank-circle-outline"
                }
                style={{
                  marginTop: 10
                }}
                width="100%"
                title={"Delete all notes"}
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
                  onChangeText={(value) => {
                    this.newPassword = value;
                  }}
                  autoComplete="password"
                  onSubmit={this.onPress}
                  returnKeyLabel="Change"
                  returnKeyType="done"
                  secureTextEntry
                  placeholder={"New password"}
                />
              </>
            ) : null}

            {!novault ? (
              <View>
                <Input
                  fwdRef={passInputRef}
                  autoCapitalize="none"
                  testID={notesnook.ids.dialogs.vault.pwd}
                  onChangeText={(value) => {
                    this.password = value;
                  }}
                  autoComplete="password"
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
                  onErrorCheck={() => null}
                  marginBottom={0}
                  autoComplete="password"
                  returnKeyLabel="Create"
                  returnKeyType="done"
                  onChangeText={(value) => {
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
                type={this.state.biometricUnlock ? "transparent" : "gray"}
              />
            ) : null}
          </View>

          <DialogButtons
            onPressNegative={this.close}
            onPressPositive={this.onPress}
            loading={loading}
            positiveType={
              deleteVault || clearVault ? "errorShade" : "transparent"
            }
            positiveTitle={
              deleteVault
                ? "Delete"
                : clearVault
                ? "Clear"
                : fingerprintAccess
                ? "Enable"
                : this.state.revokeFingerprintAccess
                ? "Revoke"
                : changePassword
                ? "Change"
                : note.locked
                ? deleteNote
                  ? "Delete"
                  : share
                  ? "Share "
                  : goToEditor
                  ? "Open"
                  : "Unlock"
                : !note.id
                ? "Create"
                : "Lock"
            }
          />
        </View>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
