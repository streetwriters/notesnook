import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
  setAccentColor,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme,
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import {FlatList} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';
import {useForceUpdate} from '../ListsEditor';
import {AnimatedSafeAreaView} from '../Home';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Settings = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    onThemeUpdate(() => {
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);
  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <View>
        <Header colors={colors} heading="Settings" canGoBack={false} />

        <FlatList
          data={[
            {
              name: 'Sync',
              icon: 'refresh-ccw',
              switch: true,
            },
            {
              name: 'Dark Mode',
              icon: 'moon',
              switch: true,
            },
            {
              name: 'Sunset to Sunrise',
              icon: null,
              switch: true,
              step: true,
            },
          ]}
          ListHeaderComponent={
            <View>
              <TouchableOpacity
                activeOpacity={opacity}
                onPress={() => {
                  NavigationService.navigate('AccountSettings');
                }}
                style={{
                  borderWidth: 1,
                  borderRadius: 5,
                  width: '90%',
                  marginHorizontal: '5%',
                  paddingHorizontal: ph,
                  borderColor: colors.nav,
                  paddingVertical: pv + 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                <Text
                  style={{
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.regular,
                    color: colors.pri,
                  }}>
                  My Account
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({item, index}) => (
            <TouchableOpacity
              activeOpacity={opacity}
              style={{
                borderBottomWidth: 1,
                width: item.step ? '85%' : '90%',
                marginHorizontal: '5%',
                borderBottomColor: colors.nav,
                paddingVertical: pv + 5,
                flexDirection: 'row',
                paddingHorizontal: ph,
                justifyContent: 'space-between',
                alignItems: 'center',
                marginLeft: item.step ? '10%' : '5%',
              }}>
              <Text
                style={{
                  fontSize: item.step ? SIZE.sm : SIZE.md,
                  fontFamily: WEIGHT.regular,
                  textAlignVertical: 'center',
                  color: colors.pri,
                }}>
                <Icon name={item.icon} size={SIZE.md} color={colors.icon} />
                {'  '} {item.name}
              </Text>
              {item.switch ? (
                <Icon
                  name="toggle-right"
                  color={colors.icon}
                  size={item.step ? SIZE.sm : SIZE.md}
                />
              ) : null}
            </TouchableOpacity>
          )}
        />

        <View
          style={{
            borderBottomWidth: 1,
            width: '90%',
            marginHorizontal: '5%',
            borderBottomColor: colors.nav,
            paddingVertical: pv + 5,

            paddingHorizontal: ph,
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
            }}>
            Accent Color
          </Text>

          <ScrollView
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginTop: 10,
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
                onPress={() => {
                  setAccentColor(item);
                  setColorScheme(
                    colors.night ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT,
                  );
                  AsyncStorage.setItem('accentColor', item);
                }}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  marginRight: 10,
                  marginVertical: 5,
                }}>
                <View
                  style={{
                    width: 45,
                    height: 45,
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
        </View>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            borderBottomWidth: 1,
            width: '90%',
            marginHorizontal: '5%',
            borderBottomColor: colors.nav,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            paddingHorizontal: ph,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
            }}>
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            borderBottomWidth: 1,
            width: '90%',
            marginHorizontal: '5%',
            borderBottomColor: colors.nav,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            paddingHorizontal: ph,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
            }}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            borderBottomWidth: 1,
            width: '90%',
            marginHorizontal: '5%',
            borderBottomColor: colors.nav,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            paddingHorizontal: ph,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
            }}>
            About Notes.
          </Text>
        </TouchableOpacity>
      </View>
    </AnimatedSafeAreaView>
  );
};

Settings.navigationOptions = {
  header: null,
};

export default Settings;
