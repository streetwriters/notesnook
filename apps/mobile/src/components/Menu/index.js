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
import MMKV from 'react-native-mmkv-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  ph,
  setColorScheme,
  SIZE,
} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {sideMenuRef} from '../../utils/refs';
import {DDS} from '../../utils/utils';
import {ColorSection} from './ColorSection';
import {MenuListItem} from './MenuListItem';
import {TagsSection} from './TagsSection';
import {UserSection} from './UserSection';

const AnimatedSafeAreaView = createAnimatableComponent(SafeAreaView);

export const Menu = ({
  close = () => {},
  hide,
  update = () => {},
  noTextMode = false,
  onButtonLongPress = () => {},
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  // todo

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    dispatch({type: ACTIONS.THEME, colors: newColors});
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
      icon: 'settings-outline',
      func: () => NavigationService.navigate('Settings'),
      close: true,
    },
  ];

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        width: '100%',
        backgroundColor: colors.bg,
        borderRightWidth: noTextMode ? 1 : 0,
        borderRightColor: noTextMode ? colors.nav : 'transparent',
      }}>
      <View
        style={{
          minHeight: 2,
          width: '100%',
          paddingHorizontal: noTextMode ? 0 : ph,
          height: DDS.isTab && noTextMode ? 50 : 0,
          marginBottom: 0,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: noTextMode ? 'center' : 'space-between',
          marginTop:
            Platform.OS == 'ios'
              ? 0
              : DDS.isTab
              ? noTextMode
                ? StatusBar.currentHeight
                : 0
              : StatusBar.currentHeight,
        }}>
        {DDS.isTab && noTextMode ? (
          <TouchableOpacity
            onPress={() => {
              sideMenuRef.current?.openDrawer();
            }}
            style={{
              alignItems: 'center',
              height: 35,
              justifyContent: 'center',
            }}>
            <Icon
              style={{
                marginTop: noTextMode ? 0 : 7.5,
              }}
              name="menu"
              size={SIZE.lg}
              color={colors.pri}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{minHeight: '50%'}}
        showsVerticalScrollIndicator={false}>
        {listItems.map((item, index) => (
          <MenuListItem item={item} index={index} noTextMode={noTextMode} />
        ))}

        <MenuListItem
          noTextMode={noTextMode}
          index={10}
          item={{
            name: 'Tags',
            icon:'tag',
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
            <MenuListItem item={item} index={index} ignore={true} noTextMode={noTextMode} />
          ))}
        </View>

        <UserSection noTextMode={noTextMode} />
      </View>
    </AnimatedSafeAreaView>
  );
};
