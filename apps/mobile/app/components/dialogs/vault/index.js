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
import BiometricService from "../../../services/biometrics";
import { DDS } from "../../../services/device-detection";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { getElevationStyle } from "../../../utils/elevation";
import {
  eCloseActionSheet,
  eCloseVaultDialog,
  eOnLoadNote,
  eOpenVaultDialog,
  eUpdateNoteInEditor
} from "../../../utils/events";
import { deleteItems } from "../../../utils/functions";
import { fluidTabsRef } from "../../../utils/global-refs";
import { convertNoteToText } from "../../../utils/note-to-text";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import DialogButtons from "../../dialog/dialog-buttons";
import DialogHeader from "../../dialog/dialog-header";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

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
      title: strings.goToEditor(),
      description: null,
      clearVault: false,
      deleteVault: false,
      deleteAll: false,
      noteLocked: false
    };

    this.passInputRef = createRef();
    this.confirmPassRef = createRef();
    this.changePassInputRef = createRef();

    this.password = null;
    this.confirmPassword = null;
    this.newPassword = null;
    this.title = !this.state.novault
      ? strings.createVault()
      : this.state.fingerprintAccess
      ? strings.vaultFingerprintUnlock()
      : this.state.revokeFingerprintAccess
      ? strings.revokeVaultFingerprintUnlock()
      : this.state.changePassword
      ? strings.changeVaultPassword()
      : this.state.noteLocked
      ? this.state.deleteNote
        ? strings.deleteNote()
        : this.state.share
        ? strings.shareNote()
        : this.state.copyNote
        ? strings.copyNote()
        : this.state.goToEditor
        ? strings.goToEditor()
        : strings.goToEditor()
      : strings.lockNote();
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
      deleteVault: data.deleteVault,
      noteLocked: data.item && (await db.vaults.itemExists(data.item))
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
      ToastManager.show({
        heading: this.state.title,
        message: strings.pleaseWait() + "...",
        type: "success",
        context: "local"
      });
      return;
    }

    Navigation.queueRoutesForUpdate();

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
      ToastManager.show({
        heading: strings.passwordNotEntered(),
        type: "error",
        context: "local"
      });
      return;
    }

    if (!this.state.novault) {
      if (this.password !== this.confirmPassword) {
        ToastManager.show({
          heading: strings.passwordNotMatched(),
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
          ToastManager.show({
            heading: strings.passwordUpdated(),
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
            ToastManager.show({
              heading: strings.passwordIncorrect(),
              type: "error",
              context: "local"
            });
          } else {
            ToastManager.error(e);
          }
        });
    } else if (this.state.locked) {
      if (!this.password || this.password.trim() === 0) {
        ToastManager.show({
          heading: strings.passwordIncorrect(),
          type: "error",
          context: "local"
        });
        this.setState({
          wrongPassword: true
        });
        return;
      }
      if (this.state.noteLocked) {
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
      let verified = true;
      if (await db.user.getUser()) {
        verified = await db.user.verifyPassword(this.password);
      }
      if (verified) {
        let noteIds = [];
        if (this.state.deleteAll) {
          const vault = await db.vaults.default();
          const relations = await db.relations.from(vault, "note").get();
          noteIds = relations.map((item) => item.toId);
        }
        await db.vault.delete(this.state.deleteAll);

        if (this.state.deleteAll) {
          noteIds.forEach((id) => {
            eSendEvent(
              eUpdateNoteInEditor,
              {
                id: id,
                deleted: true
              },
              true
            );
          });
        }

        eSendEvent("vaultUpdated");
        this.setState({
          loading: false
        });
        this.close();
      } else {
        ToastManager.show({
          heading: strings.passwordIncorrect(),
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
      const vault = await db.vaults.default();
      const relations = await db.relations.from(vault, "note").get();
      const noteIds = relations.map((item) => item.toId);

      await db.vault.clear(this.password);

      noteIds.forEach((id) => {
        eSendEvent(
          eUpdateNoteInEditor,
          {
            id: id,
            deleted: true
          },
          true
        );
      });
      this.setState({
        loading: false
      });
      this.close();
      eSendEvent("vaultUpdated");
    } catch (e) {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
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
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
      return;
    } else {
      await db.vault.add(this.state.note.id);

      eSendEvent(eUpdateNoteInEditor, this.state.note, true);

      this.close();
      ToastManager.show({
        message: strings.noteLocked(),
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
      ToastManager.show({
        heading: strings.passwordIncorrect(),
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
      this._takeErrorAction(e);
    }
  };
  async _deleteNote() {
    try {
      await db.vault.remove(this.state.note.id, this.password);
      await deleteItems("note", [this.state.note.id]);
      this.close();
    } catch (e) {
      this._takeErrorAction(e);
    }
  }

  async _enrollFingerprint(password) {
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
          ToastManager.show({
            heading: strings.biometricUnlockEnabled(),
            type: "success",
            context: "global"
          });
          this.close();
        } catch (e) {
          this.close();
          ToastManager.show({
            heading: strings.passwordIncorrect(),
            type: "error",
            context: "local"
          });
          this.setState({
            loading: false
          });
        }
      }
    );
  }

  async _createVault() {
    await db.vault.create(this.password);

    if (this.state.biometricUnlock) {
      await this._enrollFingerprint(this.password);
    }
    if (this.state.note?.id) {
      await db.vault.add(this.state.note.id);
      eSendEvent(eUpdateNoteInEditor, this.state.note, true);
      this.setState({
        loading: false
      });
      ToastManager.show({
        heading: strings.noteLocked(),
        type: "success",
        context: "global"
      });
      this.close();
    } else {
      ToastManager.show({
        heading: strings.vaultCreated(),
        type: "success",
        context: "global"
      });
      this.close();
    }
    eSendEvent("vaultUpdated");
  }

  _permanantUnlock() {
    db.vault
      .remove(this.state.note.id, this.password)
      .then(() => {
        ToastManager.show({
          heading: strings.noteUnlocked(),
          type: "success",
          context: "global"
        });
        eSendEvent(eUpdateNoteInEditor, this.state.note, true);
        this.close();
      })
      .catch((e) => {
        this._takeErrorAction(e);
      });
  }

  _openInEditor(note) {
    this.close();
    InteractionManager.runAfterInteractions(async () => {
      eSendEvent(eOnLoadNote, {
        item: note
      });
      if (!DDS.isTab) {
        fluidTabsRef.current?.goToPage("editor");
      }
    });
  }

  async _copyNote(note) {
    Clipboard.setString((await convertNoteToText(note, true)) || "");
    ToastManager.show({
      heading: strings.noteCopied(),
      type: "success",
      context: "global"
    });
    this.close();
  }

  async _shareNote(note) {
    this.close();
    try {
      await Share.open({
        heading: note.title,
        failOnCancel: false,
        message: (await convertNoteToText(note)) || ""
      });
    } catch (e) {
      console.error(e);
    }
  }

  _takeErrorAction(e) {
    this.setState({
      wrongPassword: true,
      visible: true
    });
    setTimeout(() => {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
    }, 500);
  }

  _revokeFingerprintAccess = async () => {
    try {
      await BiometricService.resetCredentials();
      eSendEvent("vaultUpdated");
      ToastManager.show({
        heading: strings.biometricUnlockDisabled(),
        type: "success",
        context: "global"
      });
    } catch (e) {
      ToastManager.show({
        heading: e.message,
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

          this.passInputRef.current?.focus();
        }}
        statusBarTranslucent={false}
        onRequestClose={this.close}
        visible={true}
      >
        <View
          style={{
            ...getElevationStyle(5),
            width: DDS.isTab ? 350 : "85%",
            borderRadius: 10,
            backgroundColor: colors.primary.background,
            paddingTop: 12
          }}
        >
          <DialogHeader title={this.state.title} icon="shield" padding={12} />
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
                  fwdRef={this.passInputRef}
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
                      ? this.confirmPassRef.current?.focus()
                      : this.onPress;
                  }}
                  autoComplete="password"
                  returnKeyLabel={
                    changePassword ? strings.next() : this.state.title
                  }
                  returnKeyType={changePassword ? "next" : "done"}
                  secureTextEntry
                  placeholder={
                    changePassword
                      ? strings.currentPassword()
                      : strings.password()
                  }
                />

                {!this.state.biometricUnlock ||
                !this.state.isBiometryEnrolled ||
                !novault ||
                changePassword ? null : (
                  <Button
                    onPress={() =>
                      this._onPressFingerprintAuth(strings.unlockNote(), "")
                    }
                    icon="fingerprint"
                    width="100%"
                    title={strings.unlockWithBiometrics()}
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
                title={strings.deleteAllNotes()}
                type="errorShade"
              />
            )}

            {changePassword ? (
              <>
                <Seperator half />
                <Input
                  ref={this.confirmPassRef}
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
                  placeholder={strings.newPassword()}
                />
              </>
            ) : null}

            {!novault ? (
              <View>
                <Input
                  fwdRef={this.passInputRef}
                  autoCapitalize="none"
                  testID={notesnook.ids.dialogs.vault.pwd}
                  onChangeText={(value) => {
                    this.password = value;
                  }}
                  autoComplete="password"
                  returnKeyLabel={strings.next()}
                  returnKeyType="next"
                  secureTextEntry
                  onSubmit={() => {
                    this.confirmPassRef.current?.focus();
                  }}
                  placeholder={strings.password()}
                />

                <Input
                  fwdRef={this.confirmPassRef}
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
                  placeholder={strings.confirmPassword()}
                />
              </View>
            ) : null}

            {this.state.biometricUnlock &&
            !this.state.isBiometryEnrolled &&
            novault ? (
              <Paragraph>{strings.vaultEnableBiometrics()}</Paragraph>
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
                title={strings.unlockWithBiometrics()}
                iconColor={
                  this.state.biometricUnlock
                    ? colors.selected.accent
                    : colors.primary.icon
                }
                type={this.state.biometricUnlock ? "transparent" : "plain"}
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
                ? strings.delete()
                : clearVault
                ? strings.clear()
                : fingerprintAccess
                ? strings.enable()
                : this.state.revokeFingerprintAccess
                ? strings.revoke()
                : changePassword
                ? strings.change()
                : this.state.noteLocked
                ? deleteNote
                  ? strings.delete()
                  : share
                  ? strings.share()
                  : goToEditor
                  ? strings.open()
                  : strings.unlock()
                : !note.id
                ? strings.create()
                : strings.lock()
            }
          />
        </View>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
