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
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const AccountSettings = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView
      style={{
        height: '100%',
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
        data={['Subscription Status', 'Space Used', 'E-to-E Encryption']}
        ListHeaderComponent={
          <TouchableOpacity
            activeOpacity={opacity}
            style={{
              borderRadius: 5,
              width: '90%',
              marginHorizontal: '5%',
              paddingHorizontal: ph,
              borderWidth: 1,
              borderColor: '#f0f0f0',
              paddingVertical: pv + 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              backgroundColor: colors.bg,
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                color: colors.pri,
              }}>
              Backup notes
            </Text>
          </TouchableOpacity>
        }
        renderItem={({item, index}) => (
          <TouchableOpacity
            activeOpacity={opacity}
            style={{
              borderBottomWidth: 1,
              width: '90%',
              marginHorizontal: '5%',
              borderBottomColor: '#f0f0f0',
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
              }}>
              {item}
            </Text>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
              }}>
              100/90
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
          Logout
        </Text>
        <Icon size={SIZE.lg} color="white" name="log-out" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

AccountSettings.navigationOptions = {
  header: null,
};

export default AccountSettings;
