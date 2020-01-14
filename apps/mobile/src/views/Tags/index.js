import React, {useEffect, useState} from 'react';
import {View, Text, Dimensions, SafeAreaView, FlatList} from 'react-native';

import {SIZE, pv, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useAppContext} from '../../provider/useAppContext';
import {TagsPlaceHolder} from '../../components/ListPlaceholders';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Tags = ({navigation}) => {
  const {colors} = useAppContext();
  let isFocused = useIsFocused();

  if (!isFocused) {
    console.log('block rerender');
    return <></>;
  } else {
    return (
      <SafeAreaView
        style={{
          height: '100%',
          backgroundColor: colors.bg,
        }}>
        <Header canGoBack={false} heading="Tags" menu={true} />

        <View style={{width: '90%', alignSelf: 'center', height: '100%'}}>
          <FlatList
            style={{
              height: '100%',
            }}
            contentContainerStyle={{
              height: '100%',
            }}
            data={[]}
            ListEmptyComponent={
              <View
                style={{
                  height: '80%',
                  width: '100%',
                  alignItems: 'center',
                  alignSelf: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                }}>
                <TagsPlaceHolder colors={colors} />
                <Text
                  style={{
                    fontSize: SIZE.md,
                    color: colors.icon,
                  }}>
                  Tags added to notes appear here
                </Text>
                <Text
                  style={{
                    fontSize: SIZE.sm,
                    color: colors.icon,
                    marginTop: 20,
                  }}>
                  No tags found
                </Text>
              </View>
            }
            renderItem={({item, index}) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  margin: 5,
                  paddingVertical: pv,
                  borderBottomWidth: 1.5,
                  borderBottomColor: colors.navbg,
                }}>
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.md,
                    color: colors.pri,
                  }}>
                  <Text
                    style={{
                      color: colors.accent,
                    }}>
                    #
                  </Text>
                  {item.slice(1)}

                  {'\n'}
                  <Text
                    style={{
                      fontSize: SIZE.xs,
                      color: colors.icon,
                    }}>
                    10 notes
                  </Text>
                </Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }
};

Tags.navigationOptions = {
  header: null,
};

export default Tags;
