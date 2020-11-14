import React from 'react';
import {ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme,
} from '../../utils/Colors';
import {MenuItemsList} from '../../utils/index';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {ColorSection} from './ColorSection';
import {MenuListItem} from './MenuListItem';
import {TagsSection} from './TagsSection';
import {UserSection} from './UserSection';

export const Menu = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const {colors} = state;
    const insets = useSafeAreaInsets();
    const noTextMode = DDS.isTab && !DDS.isSmallTab;
    function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
      let newColors = setColorScheme(colors, accent);
      dispatch({type: Actions.THEME, colors: newColors});
    }

    React.useEffect(() => {
      console.log('rerendering drawer');
    });

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
            flexGrow: 1,
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
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
              paddingHorizontal: '10%',
            }}>
            <Heading style={{marginBottom: 2.5}} size={SIZE.sm}>
              Your Pins
            </Heading>
            <Paragraph
              style={{textAlign: 'center'}}
              color={colors.icon}
              size={SIZE.xs}>
              You have not pinned anything yet. You can pin topics and tags
              here.
            </Paragraph>
          </View>
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
  },
  () => true,
);
