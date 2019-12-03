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
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import {FlatList} from 'react-native-gesture-handler';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Settings = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView>
      <Header colors={colors} heading="Settings" canGoBack={false} />

      <FlatList
        data={['Sync']}
        ListHeaderComponent={
          <FlatList
            data={['My Account']}
            ListHeaderComponent={<FlatList />}
            renderItem={({item, index}) => (
              <TouchableOpacity
                activeOpacity={opacity}
                style={{
                  borderWidth: 1,
                  borderRadius: 5,
                  width: '90%',
                  marginHorizontal: '5%',
                  paddingHorizontal: ph,
                  borderColor: '#f0f0f0',
                  paddingVertical: pv + 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 15,
                }}>
                <Text
                  style={{
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.regular,
                  }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
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
            <Icon size={SIZE.lg} color={colors.icon} name="toggle-left" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

Settings.navigationOptions = {
  header: null,
};

export default Settings;
