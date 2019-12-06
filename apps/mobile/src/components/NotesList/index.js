import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';

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
import {Reminder} from '../Reminder';
import {getElevation} from '../../utils/utils';
import NoteItem from '../NoteItem';
import NavigationService from '../../services/NavigationService';
import {storage} from '../../../App';

export const NotesList = ({keyword, searchResults, margin, onScroll}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <>
      <FlatList
        data={searchResults}
        ListFooterComponent={
          <View
            style={{
              height: 150,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: colors.navbg,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
              }}>
              - End -
            </Text>
          </View>
        }
        onScroll={event => {
          y = event.nativeEvent.contentOffset.y;
          onScroll(y);
        }}
        ListHeaderComponent={
          <>
            <Text
              style={{
                fontSize: SIZE.lg,
                marginTop: margin,
                fontFamily: WEIGHT.medium,
                color: colors.pri,
                paddingHorizontal: Platform.isPad ? '2.5%' : '5%',
                maxWidth: '100%',
              }}>
              Search Results for{' '}
              <Text
                style={{
                  color: colors.accent,
                }}>
                {keyword}{' '}
              </Text>
            </Text>
          </>
        }
        renderItem={({item, index}) => <NoteItem item={item} index={index} />}
      />
    </>
  );
};
