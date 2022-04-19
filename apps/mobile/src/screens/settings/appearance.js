import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Menu, { MenuItem } from 'react-native-reanimated-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PressableButton } from '../../components/ui/pressable';
import Paragraph from '../../components/ui/typography/paragraph';
import { DDS } from '../../services/device-detection';
import { ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { useSettingStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { hexToRGBA, RGB_Linear_Shade, switchAccentColor } from '../../utils/color-scheme/utils';
import { MenuItemsList } from '../../utils/constants';
import { tabBarRef } from '../../utils/global-refs';
import { pv, SIZE } from '../../utils/size';

export const HomagePageSelector = () => {
  const colors = useThemeStore(state => state.colors);
  const settings = useSettingStore(state => state.settings);
  const menuRef = useRef();
  const [width, setWidth] = useState(0);
  return (
    <View
      onLayout={event => {
        setWidth(event.nativeEvent.layout.width);
      }}
      style={{
        width: '100%'
      }}
    >
      <Menu
        ref={menuRef}
        animationDuration={200}
        style={{
          borderRadius: 5,
          backgroundColor: colors.bg,
          width: width,
          marginTop: 60
        }}
        button={
          <PressableButton
            onPress={async () => {
              await PremiumService.verify(menuRef.current?.show);
            }}
            type="grayBg"
            customStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 10,
              width: '100%',
              justifyContent: 'space-between',
              padding: 12
            }}
          >
            <Paragraph>{settings.homepage}</Paragraph>
            <Icon color={colors.icon} name="menu-down" size={SIZE.md} />
          </PressableButton>
        }
      >
        {MenuItemsList.slice(0, MenuItemsList.length - 1).map(
          item =>
            item.name !== 'Monographs' && (
              <MenuItem
                key={item.name}
                onPress={async () => {
                  menuRef.current?.hide();
                  await SettingsService.set({ homepage: item.name });
                  ToastEvent.show({
                    heading: 'Homepage set to ' + item.name,
                    message: 'Restart the app for changes to take effect.',
                    type: 'success'
                  });
                }}
                style={{
                  backgroundColor: settings.homepage === item.name ? colors.nav : 'transparent',
                  width: '100%',
                  maxWidth: width
                }}
                textStyle={{
                  fontSize: SIZE.md,
                  color: settings.homepage === item.name ? colors.accent : colors.pri
                }}
              >
                {item.name}
              </MenuItem>
            )
        )}
      </Menu>
    </View>
  );
};

export const AccentColorPicker = ({ settings = true, wrap = false }) => {
  const colors = useThemeStore(state => state.colors);
  function changeAccentColor(color) {
    switchAccentColor(color);
  }

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={{
        borderRadius: 5,
        padding: 5,
        marginTop: 10,
        marginBottom: wrap ? 0 : pv + 5,
        width: '100%',
        paddingHorizontal: wrap ? 0 : 12,
        maxWidth: settings ? null : '100%'
      }}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      contentContainerStyle={{
        alignSelf: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: wrap ? '100%' : null,
        alignContent: wrap && 'flex-start',
        justifyContent: wrap && 'flex-start'
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
              SettingsService.set({
                theme: {
                  accent: item,
                  dark: SettingsService.get().theme.dark
                }
              });
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
            <Icon size={DDS.isLargeTablet() ? SIZE.lg : SIZE.xxl} color="white" name="check" />
          ) : null}
        </PressableButton>
      ))}
      <View style={{ width: 50 }} />
    </ScrollView>
  );
};
