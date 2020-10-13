import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import {createAnimatableComponent} from 'react-native-animatable';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import NavigationService from '../../services/Navigation';
import {sideMenuRef} from '../../utils/Refs';
import {dWidth} from '../../utils';
import {ColorSection} from './ColorSection';
import {MenuListItem} from './MenuListItem';
import {TagsSection} from './TagsSection';
import {UserSection} from './UserSection';
import Seperator from '../Seperator';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ACCENT, COLOR_SCHEME, COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT, setColorScheme} from "../../utils/Colors";
import {ph, SIZE} from "../../utils/SizeUtils";
import {DDS} from "../../services/DeviceDetection";
import {MMKV} from "../../utils/MMKV";

export const Menu = ({
  close = () => {},
  hide,
  update = () => {},
  noTextMode = false,
  onButtonLongPress = () => {},
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const insets = useSafeAreaInsets();

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    dispatch({type: Actions.THEME, colors: newColors});
  }

  const listItems = [
    {
      name: 'Home',
      icon: 'home-variant-outline',
      func: () => NavigationService.navigate('Home'),
      close: true,
    },
    {
      name: 'Notebooks',
      icon: 'book-outline',
      func: () => NavigationService.navigate('Folders'),
      close: true,
    },

    {
      name: 'Favorites',
      icon: 'star-outline',
      func: () => NavigationService.navigate('Favorites'),
      close: true,
    },

    {
      name: 'Trash',
      icon: 'delete-outline',
      func: () => NavigationService.navigate('Trash'),
      close: true,
    },
  ];

  const listItems2 = [
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
      on: colors.night ? true : false,
      close: false,
    },
    {
      name: 'Settings',
      icon: 'cog-outline',
      func: () => NavigationService.navigate('Settings'),
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
        paddingTop:insets.top,
        borderRightWidth:1,
        borderRightColor:colors.nav
      }}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          minHeight: '50%',
        }}
        showsVerticalScrollIndicator={false}>
        {listItems.map((item, index) => (
          <MenuListItem
            testID={item.name}
            key={item.name}
            item={item}
            index={index}
            noTextMode={noTextMode}
          />
        ))}

        <MenuListItem
          key="Tags"
          testID="Tags"
          noTextMode={noTextMode}
          index={10}
          item={{
            name: 'Tags',
            icon: 'tag',
            func: () => {
              close();
              NavigationService.navigate('Tags');
            },
          }}
        />

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
          {listItems2.map((item, index) => (
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
