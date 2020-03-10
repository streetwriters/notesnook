import React from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MMKV from 'react-native-mmkv-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  opacity,
  pv,
  setColorScheme,
  SIZE,
  WEIGHT,
} from '../../common/common';
import Container from '../../components/Container';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
const AppearanceSettings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  ///
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
      heading="Apperance "
      canGoBack={false}
      noSearch={true}
      noSelectionHeader={true}
      noBottomButton={true}>
      <View
        style={{
          marginTop: Platform.OS == 'ios' ? 135 - 60 : 155 - 60,
        }}
      />
      <View
        style={{
          paddingHorizontal: 12,
        }}>
        <View>
          <View
            style={{
              marginTop: 10,
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              Accent Color
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginTop: 10,
              marginHorizontal: 0,
              borderBottomWidth: 1,
              paddingBottom: pv + 5,
              borderBottomColor: colors.nav,
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

                  MMKV.setString('accentColor', item);
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
          </ScrollView>
          <TouchableOpacity
            onPress={() => {
              if (!colors.night) {
                MMKV.setString('theme', JSON.stringify({night: true}));
                changeColorScheme(COLOR_SCHEME_DARK);
              } else {
                MMKV.setString('theme', JSON.stringify({night: false}));

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
              borderBottomWidth: 1,
              borderBottomColor: colors.nav,
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              Dark Mode
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
                MMKV.setString('theme', JSON.stringify({night: true}));
                changeColorScheme(COLOR_SCHEME_DARK);
              } else {
                MMKV.setString('theme', JSON.stringify({night: false}));

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
              borderBottomWidth: 1,
              borderBottomColor: colors.nav,
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              Font Scaling
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
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                  textAlignVertical: 'center',
                  color: colors.pri,
                }}>
                1.0x
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

AppearanceSettings.navigationOptions = {
  header: null,
};

export default AppearanceSettings;
