import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import ToggleSwitch from 'toggle-switch-react-native';
import { useTracked } from '../../provider';
import { useSettingStore, useUserStore } from '../../provider/stores';
import BiometricService from '../../services/BiometricService';
import { eSubscribeEvent, eUnSubscribeEvent, openVault } from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import SettingsService from '../../services/SettingsService';
import { AndroidModule, InteractionManager } from '../../utils';
import { db } from '../../utils/database';
import AppLock from './app-lock';
import { CustomButton } from './button';
import SectionHeader from './section-header';

const SettingsPrivacyAndSecurity = () => {
  const [state] = useTracked();
  const { colors } = state;
  const settings = useSettingStore(state => state.settings);
  const [collapsed, setCollapsed] = useState(true);
  const user = useUserStore(state => state.user);
  const [vaultStatus, setVaultStatus] = React.useState({
    exists: false,
    biometryEnrolled: false,
    isBiometryAvailable: false
  });

  const checkVaultStatus = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      db.vault.exists().then(async r => {
        let available = await BiometricService.isBiometryAvailable();
        let fingerprint = await BiometricService.hasInternetCredentials();
        console.log(available);
        setVaultStatus({
          exists: r,
          biometryEnrolled: fingerprint,
          isBiometryAvailable: available ? true : false
        });
      });
    });
  }, [collapsed]);

  useEffect(() => {
    checkVaultStatus();
    eSubscribeEvent('vaultUpdated', () => checkVaultStatus());
    return () => {
      eUnSubscribeEvent('vaultUpdated', () => checkVaultStatus());
    };
  }, [collapsed]);

  const toggleBiometricUnlocking = () => {
    openVault({
      item: {},
      fingerprintAccess: !vaultStatus.biometryEnrolled,
      revokeFingerprintAccess: vaultStatus.biometryEnrolled,
      novault: true,
      title: vaultStatus.biometryEnrolled
        ? 'Revoke biometric unlocking'
        : 'Enable biometery unlock',
      description: vaultStatus.biometryEnrolled
        ? 'Disable biometric unlocking for notes in vault'
        : 'Enable biometric unlocking for notes in vault'
    });
  };

  return (
    <>
      <SectionHeader collapsed={collapsed} setCollapsed={setCollapsed} title="Privacy & security" />
      {collapsed ? null : (
        <>
          <CustomButton
            key="telemetry"
            title="Enable telemetry"
            tagline="Help improve Notesnook by sending completely anonymized private analytics and bug reports."
            onPress={() => {
              SettingsService.set('telemetry', !settings.telemetry);
            }}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.telemetry}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={isOn => {
                  SettingsService.set('telemetry', isOn);
                }}
              />
            }
          />

          <CustomButton
            key="privacyMode"
            title="Privacy mode"
            tagline="Hide app contents when you switch to other apps. This will also disable screenshot taking in the app."
            onPress={() => {
              Platform.OS === 'android'
                ? AndroidModule.setSecureMode(!settings.privacyScreen)
                : enabled(true);

              SettingsService.set('privacyScreen', !settings.privacyScreen);
            }}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.privacyScreen}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={isOn => {
                  Platform.OS === 'android' ? AndroidModule.setSecureMode(isOn) : enabled(true);
                  SettingsService.set('privacyScreen', isOn);
                }}
              />
            }
          />

          {user || vaultStatus.isBiometryAvailable ? (
            <CustomButton
              key="appLock"
              title="App lock"
              tagline="Require biometrics to access your notes."
              onPress={() => {
                AppLock.present();
              }}
              maxWidth="90%"
            />
          ) : null}

          {vaultStatus.exists ? (
            <>
              {vaultStatus.isBiometryAvailable ? (
                <CustomButton
                  key="fingerprintVaultUnlock"
                  title="Vault biometrics unlock"
                  tagline="Access notes in vault using biometrics"
                  onPress={toggleBiometricUnlocking}
                  maxWidth="90%"
                  customComponent={
                    <ToggleSwitch
                      isOn={vaultStatus.biometryEnrolled}
                      onColor={colors.accent}
                      offColor={colors.icon}
                      size="small"
                      animationSpeed={150}
                      onToggle={toggleBiometricUnlocking}
                    />
                  }
                />
              ) : null}
              <CustomButton
                key="changeVaultPassword"
                title="Change vault password"
                tagline="Setup a new password for the vault"
                onPress={() => {
                  openVault({
                    item: {},
                    changePassword: true,
                    novault: true,
                    title: 'Change vault password',
                    description: 'Set a new password for your vault.'
                  });
                }}
              />
              <CustomButton
                key="clearVault"
                title="Clear vault"
                tagline="Unlock all locked notes and clear vault."
                onPress={() => {
                  openVault({
                    item: {},
                    clearVault: true,
                    novault: true,
                    title: 'Clear vault',
                    description:
                      'Enter vault password to unlock and remove all notes from the vault.'
                  });
                }}
              />

              <CustomButton
                key="deleteVault"
                title="Delete vault"
                tagline="Delete vault (and optionally remove all notes)."
                onPress={() => {
                  openVault({
                    item: {},
                    deleteVault: true,
                    novault: true,
                    title: 'Delete vault',
                    description: 'Enter your account password to delete your vault.'
                  });
                }}
              />
            </>
          ) : (
            <CustomButton
              key="createVault"
              title="Create vault"
              tagline="Secure your notes by adding the to the vault."
              onPress={() => {
                PremiumService.verify(() => {
                  openVault({
                    item: {},
                    novault: false,
                    title: 'Create vault',
                    description: 'Set a password to create vault and lock notes.'
                  });
                });
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default SettingsPrivacyAndSecurity;
