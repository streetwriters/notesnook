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
import Icon from 'react-native-vector-icons/Ionicons';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {useAppContext} from '../../provider/useAppContext';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Lists = ({navigation}) => {
  const {colors} = useAppContext();

  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
          marginBottom: h * 0.04,
        }}>
        <Text
          style={{
            fontSize: SIZE.xl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          Lists
        </Text>
        <Icon name="md-more" color={colors.icon} size={SIZE.xl} />
      </View>

      <ListItem />
    </SafeAreaView>
  );
};

Lists.navigationOptions = {
  header: null,
};

export default Lists;
