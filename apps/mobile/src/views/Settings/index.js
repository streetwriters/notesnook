import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';
import {
  opacity,
  pv,
  SIZE,
  WEIGHT,
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme,
} from '../../common/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../../components/Container';
import {useTracked} from '../../provider';
import {w} from '../../utils/utils';
import {ACTIONS} from '../../provider/actions';
import FastStorage from 'react-native-fast-storage';
export const Settings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, user} = state;

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(newColors.night ? 'light-content' : 'dark-content');

    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  function changeAccentColor(accentColor) {
    ACCENT.color = accentColor;
    ACCENT.shade = accentColor + '12';
    changeColorScheme();
  }

  return (
    <Container
      menu={true}
      heading="Settings"
      canGoBack={false}
      noSearch={true}
      noSelectionHeader={true}
      noBottomButton={true}>
      <View
        style={{
          marginTop: Platform.OS == 'ios' ? 135 - 60 : 155 - 60,
        }}
      />

      <ScrollView
        style={{
          paddingHorizontal: 12,
        }}>
        <Text
          style={{
            fontSize: SIZE.xs,
            fontFamily: WEIGHT.bold,
            textAlignVertical: 'center',
            color: colors.accent,

            borderBottomColor: colors.nav,
            borderBottomWidth: 0.5,
            paddingBottom: 3,
          }}>
          Appearance
        </Text>

        <Text
          style={{
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            textAlignVertical: 'center',
            color: colors.pri,
            marginTop: pv + 5,
          }}>
          Accent Color
        </Text>

        <View
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
          style={{
            backgroundColor: colors.shade,
            borderRadius: 5,
            padding: 5,
            marginTop: 10,
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {[
            '#e6194b',
            '#3cb44b',
            '#ffe119',
            '#0560FF',
            '#f58231',
            '#911eb4',
            '#46f0f0',
            '#f032e6',
            '#bcf60c',
            '#fabebe',
          ].map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                changeAccentColor(item);

                FastStorage.setItem('accentColor', item);
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
                marginVertical: 5,
              }}>
              <View
                style={{
                  width: 35,
                  height: 35,
                  backgroundColor: item,
                  borderRadius: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {colors.accent === item ? (
                  <Icon size={SIZE.lg} color="white" name="check" />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!colors.night) {
              FastStorage.setItem('theme', JSON.stringify({night: true}));
              changeColorScheme(COLOR_SCHEME_DARK);
            } else {
              FastStorage.setItem('theme', JSON.stringify({night: false}));

              changeColorScheme(COLOR_SCHEME_LIGHT);
            }
          }}
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Dark mode
          </Text>
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-switch' : 'toggle-switch-off'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (!colors.night) {
              FastStorage.setItem('theme', JSON.stringify({night: true}));
              changeColorScheme(COLOR_SCHEME_DARK);
            } else {
              FastStorage.setItem('theme', JSON.stringify({night: false}));

              changeColorScheme(COLOR_SCHEME_LIGHT);
            }
          }}
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            paddingBottom: 20,
            paddingTop: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Font scaling
          </Text>

          <View
            style={{
              borderBottomWidth: 1,
              borderColor: colors.nav,
              paddingVertical: 1,
              paddingHorizontal: 5,
            }}>
            <Text
              style={{
                fontSize: SIZE.xs,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              1.0x
            </Text>
          </View>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: SIZE.xs,
            fontFamily: WEIGHT.bold,
            textAlignVertical: 'center',
            color: colors.accent,

            borderBottomColor: colors.nav,
            borderBottomWidth: 0.5,
            paddingBottom: 3,
          }}>
          Editor Settings
        </Text>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            flexDirection: 'row',
            marginTop: pv + 5,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: pv + 5,
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Show toolbar on top
          </Text>
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-switch' : 'toggle-switch-off'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',

            paddingBottom: pv + 5,
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Show keyboard on open
          </Text>
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-switch' : 'toggle-switch-off'}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: SIZE.xs,
            fontFamily: WEIGHT.bold,
            textAlignVertical: 'center',
            color: colors.accent,

            borderBottomColor: colors.nav,
            borderBottomWidth: 0.5,
            paddingBottom: 3,
          }}>
          Account Settings
        </Text>

        <Text
          style={{
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            textAlignVertical: 'center',
            color: colors.pri,
            marginTop: pv + 5,
          }}>
          Logged in as:
        </Text>

        <View
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'center',
            flexDirection: 'row',
            width: '100%',
            paddingVertical: pv,
            marginBottom: pv + 5,
            marginTop: pv,
            backgroundColor: colors.accent,
            borderRadius: 5,
            padding: 5,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon size={SIZE.lg} color="white" name="account-outline" />
            <Text
              style={{
                color: 'white',
                marginLeft: 5,
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
              }}>
              {user.username}
            </Text>
          </View>

          <View
            style={{
              borderRadius: 5,
              padding: 5,
              paddingVertical: 2.5,
              backgroundColor: 'white',
            }}>
            <Text
              style={{
                color: colors.accent,
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs,
              }}>
              Pro
            </Text>
          </View>
        </View>

        {[
          {
            name: 'Backup my notes',
          },

          {
            name: 'My vault',
          },
          {
            name: 'Subscription status',
          },
          {
            name: 'Change password',
          },
          {
            name: 'Logout',
          },
        ].map(item => (
          <TouchableOpacity
            key={item.name}
            activeOpacity={opacity}
            style={{
              width: '100%',

              paddingBottom: pv + 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}

        <Text
          style={{
            fontSize: SIZE.xs,
            fontFamily: WEIGHT.bold,
            textAlignVertical: 'center',
            color: colors.accent,

            borderBottomColor: colors.nav,
            borderBottomWidth: 0.5,
            paddingBottom: 3,
            marginBottom: pv + 5,
          }}>
          Other
        </Text>

        {[
          {
            name: 'Terms of Service',
            func: () => {},
          },
          {
            name: 'Privacy Policy',
            func: () => {},
          },
          {
            name: 'About',
            func: () => {},
          },
        ].map(item => (
          <TouchableOpacity
            key={item.name}
            activeOpacity={opacity}
            onPress={item.func}
            style={{
              width: item.step ? '85%' : w - 24,
              paddingBottom: pv + 5,
            }}>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              {item.name}
            </Text>
            {item.customComponent ? item.customComponent : null}
          </TouchableOpacity>
        ))}
        <View
          style={{
            height: 300,
          }}
        />
      </ScrollView>
    </Container>
  );
};

Settings.navigationOptions = {
  header: null,
};

export default Settings;
