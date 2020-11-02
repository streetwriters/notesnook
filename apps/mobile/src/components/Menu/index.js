import React from 'react';
import {ScrollView, StatusBar, View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ColorSection} from './ColorSection';
import {MenuListItem} from './MenuListItem';
import {TagsSection} from './TagsSection';
import {UserSection} from './UserSection';
import Seperator from '../Seperator';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme,
} from '../../utils/Colors';
import {MenuItemsList} from "../../utils/index"
import {MMKV} from '../../utils/mmkv';

export const Menu = ({close = () => {}, hide, noTextMode = false}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const insets = useSafeAreaInsets();

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    dispatch({type: Actions.THEME, colors: newColors});
  }

  const BottomItemsList = [
    {
      name: 'Night mode',
      icon: 'theme-light-dark',
      func: () => {
        if (!colors.night) {
          MMKV.setStringAsync('theme', JSON.stringify({night: true}));
          changeColorScheme(COLOR_SCHEME_DARK);
        } else {
          MMKV.setStringAsync('theme', JSON.stringify({night: false}));
          changeColorScheme(COLOR_SCHEME_LIGHT);
        }
      },
      switch: true,
      on: !!colors.night,
      close: false,
    },
    {
      name: 'Settings',
      icon: 'cog-outline',
      close: true,
    },
  ];

  return (
    <View
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        width: '100%',
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        borderRightWidth: 1,
        borderRightColor: colors.nav,
      }}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          minHeight: '50%',
        }}
        showsVerticalScrollIndicator={false}>
        
          {MenuItemsList.map((item, index) => (
            <MenuListItem
              testID={item.name}
              key={item.name}
              item={item}
              index={index}
              noTextMode={noTextMode}
            />
          ))}

        {noTextMode ? null : <TagsSection />}
        <ColorSection noTextMode={noTextMode} />
      </ScrollView>

      <View
        style={{
          width: '100%',
          justifyContent: noTextMode ? 'center' : 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginBottom: 15,
        }}>
        <View
          style={{
            width: '100%',
          }}>
          {BottomItemsList.map((item, index) => (
            <MenuListItem
              testID={item.name == 'Night mode' ? 'night_mode' : item.name}
              key={item.name}
              item={item}
              index={index}
              ignore={true}
              noTextMode={noTextMode}
            />
          ))}
        </View>
        <Seperator half />

        <UserSection noTextMode={noTextMode} />
      </View>
    </View>
  );
};
