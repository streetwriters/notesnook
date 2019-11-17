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
export const Reminder = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <View
      style={{
        ...getElevation(10),
        width: '90%',
        marginVertical: Platform.OS === 'ios' ? h * 0.01 : '0%',
        alignSelf: 'center',
        borderRadius: br,
        backgroundColor: props.invert ? '#f0f0f0' : colors.accent,
        paddingHorizontal: ph,
        marginBottom: 20,
        padding: 5,
      }}>
      <View>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            numberOfLines={1}
            style={{
              color: props.invert ? colors.pri : 'white',
              fontSize: SIZE.md,
              fontFamily: WEIGHT.bold,
              maxWidth: '100%',
            }}>
            Pay Utility Bills
          </Text>

          <View
            style={{
              width: '20%',
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Icon
              name="md-share-alt"
              size={SIZE.lg}
              color={props.invert ? colors.icon : 'white'}
            />
            <Icon
              name="md-star"
              size={SIZE.lg}
              color={props.invert ? colors.icon : 'white'}
            />
            <Icon
              name="md-more"
              size={SIZE.lg}
              color={props.invert ? colors.icon : 'white'}
            />
          </View>
        </View>

        <View
          style={{
            width: '100%',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            numberOfLines={5}
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
              color: props.invert ? colors.icon : 'white',
              marginBottom: 3,
              maxWidth: '60%',
            }}>
            {'\n'}
            Pay all the bills
          </Text>

          <Text
            style={{
              color: props.invert ? colors.accent : 'white',
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
      </View>
    </View>
  );
};
