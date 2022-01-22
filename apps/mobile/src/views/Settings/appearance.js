import React, { useRef, useState } from 'react';
import { Appearance, ScrollView, TouchableOpacity, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-reanimated-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import { PressableButton } from '../../components/PressableButton';
import Paragraph from '../../components/Typography/Paragraph';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { useSettingStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { ToastEvent } from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import SettingsService from '../../services/SettingsService';
import { MenuItemsList } from '../../utils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_PITCH_BLACK,
  setColorScheme
} from '../../utils/Colors';
import { hexToRGBA, RGB_Linear_Shade } from '../../utils/ColorUtils';
import { MMKV } from '../../utils/mmkv';
import { tabBarRef } from '../../utils/Refs';
import { pv, SIZE } from '../../utils/SizeUtils';
import { CustomButton } from './button';
import SectionHeader from './section-header';

const SettingsAppearanceSection = () => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
  const settings = useSettingStore(state => state.settings);
  const [collapsed, setCollapsed] = useState(true);
  const menuRef = useRef();
  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    dispatch({ type: Actions.THEME, colors: newColors });
  }

  function changeAccentColor(accentColor) {
    ACCENT.color = accentColor;
    ACCENT.shade = accentColor + '12';
    changeColorScheme();
  }

  const switchTheme = async () => {
    if (SettingsService.get().useSystemTheme) {
      await SettingsService.set('useSystemTheme', false);
    } else {
      await PremiumService.verify(async () => {
        await SettingsService.set(
          'useSystemTheme',
          SettingsService.get().useSystemTheme ? false : true
        );
        if (SettingsService.get().useSystemTheme) {
          await MMKV.setStringAsync(
            'theme',
            JSON.stringify({ night: Appearance.getColorScheme() === 'dark' })
          );
          changeColorScheme(
            Appearance.getColorScheme() === 'dark' ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT
          );
        }
      });
    }
  };

  const pitchBlack = async () => {
    await SettingsService.set('pitchBlack', SettingsService.get().pitchBlack ? false : true);
    let theme = await MMKV.getStringAsync('theme');
    if (!theme) return;
    theme = JSON.parse(theme);
    if (!theme.night) return;
    if (SettingsService.get().pitchBlack) {
      changeColorScheme(COLOR_SCHEME_PITCH_BLACK);
    } else {
      changeColorScheme(COLOR_SCHEME_DARK);
    }
  };

  const reduceAnimations = async () => {
    await SettingsService.set(
      'reduceAnimations',
      SettingsService.get().reduceAnimations ? false : true
    );
  };

  return (
    <>
      <SectionHeader collapsed={collapsed} setCollapsed={setCollapsed} title="Appearance" />

      {collapsed ? null : (
        <>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 5
            }}
          >
            <Paragraph
              size={SIZE.md}
              style={{
                textAlignVertical: 'center'
              }}
            >
              Accent color
            </Paragraph>
            <Paragraph size={SIZE.sm} color={colors.icon}>
              Change the accent color of the app.
            </Paragraph>
          </View>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            onMoveShouldSetResponderCapture={() => {
              tabBarRef.current?.setScrollEnabled(false);
            }}
            onMomentumScrollEnd={() => {
              tabBarRef.current?.setScrollEnabled(true);
            }}
            style={{
              borderRadius: 5,
              padding: 5,
              marginTop: 10,
              marginBottom: pv + 5,
              width: '100%',
              paddingHorizontal: 12
            }}
            nestedScrollEnabled
            contentContainerStyle={{
              alignSelf: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap'
            }}
          >
            {[
              '#FF5722',
              '#FFA000',
              '#1B5E20',
              '#008837',
              '#757575',
              '#0560ff',
              '#009688',
              '#2196F3',
              '#880E4F',
              '#9C27B0',
              '#FF1744',
              '#B71C1C'
            ].map(item => (
              <PressableButton
                key={item}
                customColor={
                  colors.accent === item
                    ? RGB_Linear_Shade(!colors.night ? -0.2 : 0.2, hexToRGBA(item, 1))
                    : item
                }
                customSelectedColor={item}
                alpha={!colors.night ? -0.1 : 0.1}
                opacity={1}
                onPress={async () => {
                  await PremiumService.verify(async () => {
                    changeAccentColor(item);
                    await MMKV.setStringAsync('accentColor', item);
                  });
                }}
                customStyle={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                  marginVertical: 5,
                  width: DDS.isLargeTablet() ? 40 : 50,
                  height: DDS.isLargeTablet() ? 40 : 50,
                  borderRadius: 100
                }}
              >
                {colors.accent === item ? (
                  <Icon
                    size={DDS.isLargeTablet() ? SIZE.lg : SIZE.xxl}
                    color="white"
                    name="check"
                  />
                ) : null}
              </PressableButton>
            ))}
            <View style={{ width: 50 }} />
          </ScrollView>

          <CustomButton
            title="Use system theme"
            tagline="Automatically switch to dark mode when the system theme changes."
            onPress={switchTheme}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.useSystemTheme}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={switchTheme}
              />
            }
          />

          <CustomButton
            title="Pitch black"
            tagline="Save battery while using the app with pitch black dark mode on amoled displays"
            onPress={pitchBlack}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.pitchBlack}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={pitchBlack}
              />
            }
          />

          {/* <CustomButton
            title="Reduce animations"
            tagline="Enable this to reduce animations in the app."
            onPress={reduceAnimations}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.reduceAnimations}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={reduceAnimations}
              />
            }
          /> */}

          <CustomButton
            title="Dark mode"
            tagline="Switch on dark mode at night to protect your eyes."
            onPress={async () => {
              if (!colors.night) {
                await MMKV.setStringAsync('theme', JSON.stringify({ night: true }));
                changeColorScheme(
                  SettingsService.get().pitchBlack ? COLOR_SCHEME_PITCH_BLACK : COLOR_SCHEME_DARK
                );
              } else {
                await MMKV.setStringAsync('theme', JSON.stringify({ night: false }));

                changeColorScheme(COLOR_SCHEME_LIGHT);
              }
            }}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={colors.night}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={async isOn => {
                  if (!colors.night) {
                    await MMKV.setStringAsync('theme', JSON.stringify({ night: true }));
                    changeColorScheme(COLOR_SCHEME_DARK);
                  } else {
                    await MMKV.setStringAsync('theme', JSON.stringify({ night: false }));

                    changeColorScheme(COLOR_SCHEME_LIGHT);
                  }
                }}
              />
            }
          />

          <CustomButton
            title="Homepage"
            tagline={'Default screen to open on app startup '}
            onPress={async () => {
              await PremiumService.verify(menuRef.current?.show);
            }}
            customComponent={
              <Menu
                ref={menuRef}
                animationDuration={200}
                style={{
                  borderRadius: 5,
                  backgroundColor: colors.bg
                }}
                button={
                  <TouchableOpacity
                    onPress={async () => {
                      await PremiumService.verify(menuRef.current?.show);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Paragraph>{settings.homepage}</Paragraph>
                    <Icon color={colors.icon} name="menu-down" size={SIZE.md} />
                  </TouchableOpacity>
                }
              >
                {MenuItemsList.slice(0, MenuItemsList.length - 1).map((item, index) => (
                  <MenuItem
                    key={item.name}
                    onPress={async () => {
                      menuRef.current?.hide();
                      await SettingsService.set('homepage', item.name);
                      ToastEvent.show({
                        heading: 'Homepage set to ' + item.name,
                        message: 'Restart the app for changes to take effect.',
                        type: 'success'
                      });
                    }}
                    style={{
                      backgroundColor: settings.homepage === item.name ? colors.nav : 'transparent'
                    }}
                    textStyle={{
                      fontSize: SIZE.md,
                      color: settings.homepage === item.name ? colors.accent : colors.pri
                    }}
                  >
                    {item.name}
                  </MenuItem>
                ))}
              </Menu>
            }
          />
        </>
      )}
    </>
  );
};

export default SettingsAppearanceSection;
