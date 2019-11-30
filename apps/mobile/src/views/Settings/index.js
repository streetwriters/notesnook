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
import {Header} from '../../components/header';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Settings = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView>
      <Header colors={colors} heading="Settings" canGoBack={false} />
    </SafeAreaView>
  );
};

Settings.navigationOptions = {
  header: null,
};

export default Settings;
