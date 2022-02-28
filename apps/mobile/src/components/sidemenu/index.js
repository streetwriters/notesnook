import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import { useThemeStore } from '../../stores/theme';
import { Actions } from '../../stores/Actions';
import { useSettingStore, useUserStore } from '../../stores/stores';
import { DDS } from '../../services/device-detection';
import { eSendEvent } from '../../services/event-manager';
import SettingsService from '../../services/settings';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_PITCH_BLACK,
  setColorScheme
} from '../../utils/color-scheme';
import { eOpenPremiumDialog } from '../../utils/events';
import { MenuItemsList, SUBSCRIPTION_STATUS } from '../../utils/constants';
import { MMKV } from '../../utils/database/mmkv';
import umami from '../../utils/analytics';
import { ColorSection } from './color-section';
import { MenuItem } from './menu-item';
import { TagsSection } from './pinned-section';
import { UserStatus } from './user-status';

export const SideMenu = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);
    const deviceMode = useSettingStore(state => state.deviceMode);
    const insets = useSafeAreaInsets();
    const user = useUserStore(state => state.user);
    const noTextMode = false;

    function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
      let newColors = setColorScheme(colors, accent);
      useThemeStore.getState().setColors({ ...newColors });
    }

    const BottomItemsList = [
      {
        name: colors.night ? 'Day' : 'Night',
        icon: 'theme-light-dark',
        func: () => {
          if (!COLOR_SCHEME.night) {
            MMKV.setStringAsync('theme', JSON.stringify({ night: true }));
            changeColorScheme(
              SettingsService.get().pitchBlack ? COLOR_SCHEME_PITCH_BLACK : COLOR_SCHEME_DARK
            );
          } else {
            MMKV.setStringAsync('theme', JSON.stringify({ night: false }));
            changeColorScheme(COLOR_SCHEME_LIGHT);
          }
        },
        switch: true,
        on: !!colors.night,
        close: false
      },
      {
        name: 'Settings',
        icon: 'cog-outline',
        close: true
      }
    ];

    const pro = {
      name: 'Notesnook Pro',
      icon: 'crown',
      func: () => {
        umami.pageView('/pro-screen', '/sidemenu');
        eSendEvent(eOpenPremiumDialog);
      }
    };

    const renderItem = useCallback(
      () => (
        <>
          {MenuItemsList.map((item, index) => (
            <MenuItem key={item.name} item={item} testID={item.name} index={index} />
          ))}
          <ColorSection noTextMode={noTextMode} />
          <TagsSection />
        </>
      ),
      []
    );

    return (
      <View
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: colors.nav
        }}
      >
        <View
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: deviceMode !== 'mobile' ? colors.nav : colors.bg,
            paddingTop: insets.top,
            borderRadius: 10
          }}
        >
          <FlatList
            alwaysBounceVertical={false}
            contentContainerStyle={{
              flexGrow: 1
            }}
            style={{
              height: '100%',
              width: '100%',
              paddingHorizontal: 12
            }}
            showsVerticalScrollIndicator={false}
            data={[0]}
            keyExtractor={() => 'mainMenuView'}
            renderItem={renderItem}
          />
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            {!user ||
            user?.subscription?.type === SUBSCRIPTION_STATUS.TRIAL ||
            user?.subscription?.type === SUBSCRIPTION_STATUS.BASIC ? (
              <MenuItem testID={pro.name} key={pro.name} item={pro} index={0} ignore={true} />
            ) : null}

            {BottomItemsList.slice(DDS.isLargeTablet() ? 0 : 1, 3).map((item, index) => (
              <MenuItem
                testID={item.name == 'Night mode' ? notesnook.ids.menu.nightmode : item.name}
                key={item.name}
                item={item}
                index={index}
                ignore={true}
                rightBtn={
                  DDS.isLargeTablet() || item.name === 'Notesnook Pro' ? null : BottomItemsList[0]
                }
              />
            ))}
          </View>

          <View
            style={{
              width: '100%',
              paddingHorizontal: 0
            }}
          >
            <UserStatus noTextMode={noTextMode} />
          </View>
        </View>
      </View>
    );
  },
  () => true
);
