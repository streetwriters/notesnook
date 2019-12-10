import React, {useState} from 'react';
import {View, Text, FlatList, Platform} from 'react-native';

import {COLOR_SCHEME, SIZE, WEIGHT} from '../../common/common';
import * as Animatable from 'react-native-animatable';
import NoteItem from '../NoteItem';

export const NotesList = ({
  keyword = null,
  notes,
  margin,
  onScroll,
  isSearch = false,
}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <FlatList
      data={notes}
      keyExtractor={(item, index) => item.dateCreated.toString()}
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
          {isSearch ? (
            <Text
              transition="marginTop"
              delay={200}
              duration={200}
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
          ) : (
            <View style={{marginTop: margin}}></View>
          )}
        </>
      }
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
      renderItem={({item, index}) => <NoteItem item={item} index={index} />}
    />
  );
};
