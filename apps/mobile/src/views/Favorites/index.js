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
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import {useForceUpdate} from '../ListsEditor';
import {AnimatedSafeAreaView} from '../Home';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Favorites = ({navigation}) => {
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
      <Header colors={colors} heading="Favorites" canGoBack={false} />
    </AnimatedSafeAreaView>
  );
};

Favorites.navigationOptions = {
  header: null,
};

export default Favorites;
