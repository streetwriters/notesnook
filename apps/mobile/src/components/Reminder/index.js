import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Platform, Dimensions} from 'react-native';
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
import Icon from 'react-native-vector-icons/Ionicons';
import {getElevation} from '../../utils/utils';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
export const Reminder = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <TouchableOpacity
      activeOpacity={opacity}
      style={{
        ...getElevation(10),
        width: '90%',
        marginVertical: Platform.OS === 'ios' ? h * 0.02 : '5%',
        alignSelf: 'center',
        borderRadius: br,
        backgroundColor: colors.accent,
        paddingHorizontal: ph,
        paddingVertical: 5,
      }}>
      <View
        style={{
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
          name="ios-clock"
          color="white"
          size={SIZE.md}
        />

        <Text
          style={{
            paddingBottom: 5,
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: SIZE.lg,
              fontFamily: WEIGHT.bold,
            }}>
            Pay Utility Bills
          </Text>
          <Text
            style={{
              fontFamily: WEIGHT.light,
              fontSize: SIZE.xs,
              color: 'white',
            }}>
            {'\n'}
            Amount 5000 RS
          </Text>
        </Text>

        <Text
          style={{
            color: 'white',
            fontSize: SIZE.xxl,
            fontFamily: WEIGHT.light,
          }}>
          <Text
            style={{
              fontSize: SIZE.xs,
            }}>
            in
          </Text>
          00:00{''}
          <Text
            style={{
              fontSize: SIZE.xs,
            }}>
            mins
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};
