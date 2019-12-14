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
  FlatList,
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
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {useForceUpdate} from '../ListsEditor';
import {AnimatedSafeAreaView} from '../Home';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const AccountSettings = ({navigation}) => {
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
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <Header colors={colors} heading="" canGoBack={true} />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',

          alignSelf: 'center',
        }}>
        <Image
          source={require('../../assets/images/user.jpg')}
          style={{
            width: 120,
            height: 120,
            borderRadius: 100,
          }}
        />
        <Text
          style={{
            color: colors.pri,
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.lg,
            marginTop: 10,
          }}>
          Alex's Account
        </Text>
        <Text
          style={{
            color: 'white',
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.sm,
            marginTop: 10,
            backgroundColor: colors.accent,
            borderRadius: 5,
            padding: 5,
            paddingVertical: 2.5,
            marginBottom: 20,
          }}>
          Pro
        </Text>
      </View>
      <FlatList
        data={[
          {
            name: 'Backup Notes',
            icon: 'database',
          },
          {
            name: 'My Devices',
            icon: 'tablet',
          },
          {
            name: 'Vault',
            icon: 'shield',
          },

          {
            name: 'My Subscription',
            icon: 'credit-card',
          },
          {
            name: 'Change Password',
            icon: 'key',
          },
        ]}
        renderItem={({item, index}) => (
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
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              <Icon name={item.icon} size={SIZE.md} />
              {'  '} {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        activeOpacity={opacity}
        style={{
          borderRadius: 5,
          width: '90%',
          marginHorizontal: '5%',
          paddingHorizontal: ph,
          paddingVertical: pv + 5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          backgroundColor: colors.accent,
        }}>
        <Text
          style={{
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
            color: 'white',
          }}>
          <Icon size={SIZE.lg} color="white" name="log-out" />
          {'  '}
          Logout
        </Text>
      </TouchableOpacity>
    </AnimatedSafeAreaView>
  );
};

AccountSettings.navigationOptions = {
  header: null,
};

export default AccountSettings;
