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
        data={['Sync', 'Dark Mode', 'Sunset to Sunrise']}
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

      <View
        style={{
          borderBottomWidth: 1,
          width: '90%',
          marginHorizontal: '5%',
          borderBottomColor: '#f0f0f0',
          paddingVertical: pv + 5,

          paddingHorizontal: ph,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
        <Text
          style={{
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
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
            '#1790F3',
            '#f58231',
            '#911eb4',
            '#46f0f0',
            '#f032e6',
            '#bcf60c',
            '#fabebe',
          ].map(item => (
            <TouchableOpacity
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
                <Icon size={SIZE.lg} color="white" name="check" />
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
          Terms of Service
        </Text>
      </TouchableOpacity>

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
          Privacy Policy
        </Text>
      </TouchableOpacity>

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
          About Notes.
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

Settings.navigationOptions = {
  header: null,
};

export default Settings;
