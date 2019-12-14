import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Platform,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {COLOR_SCHEME, SIZE, WEIGHT, ph} from '../../common/common';
import * as Animatable from 'react-native-animatable';
import NoteItem from '../NoteItem';
import {DDS} from '../../../App';
import {w, h} from '../../utils/utils';
import {useAppContext} from '../../provider/useAppContext';
export const NotesList = ({
  keyword = null,
  notes,
  margin,
  onScroll,
  isSearch = false,
}) => {
  const {colors} = useAppContext();
  const [numColumns, setNumColumns] = useState(1);
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
        <View
          style={{
            marginTop: margin,
          }}></View>
      }
      numColumns={numColumns}
      key={numColumns}
      columnWrapperStyle={
        numColumns === 1
          ? null
          : {
              width:
                notes.length === 1
                  ? DDS.isTab
                    ? '95%'
                    : '90%'
                  : DDS.isTab
                  ? '45%'
                  : '42.5%',
            }
      }
      contentContainerStyle={{
        width:
          numColumns === 2
            ? DDS.isTab
              ? '100%'
              : null
            : DDS.isTab
            ? '95%'
            : '90%',
        alignItems: numColumns === 2 ? 'flex-start' : null,
        alignSelf: 'center',
      }}
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
      renderItem={({item, index}) => (
        <NoteItem item={item} numColumns={numColumns} index={index} />
      )}
    />
  );
};

/* 
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
        <View
          style={{
            marginTop: margin,
          }}></View>
      }
      numColumns={numColumns}
      key={numColumns}
      columnWrapperStyle={
        numColumns === 1
          ? null
          : {
              width:
                notes.length === 1
                  ? DDS.isTab
                    ? '95%'
                    : '90%'
                  : DDS.isTab
                  ? '45%'
                  : '42.5%',
            }
      }
      contentContainerStyle={{
        width:
          numColumns === 2
            ? DDS.isTab
              ? '100%'
              : null
            : DDS.isTab
            ? '95%'
            : '90%',
        alignItems: numColumns === 2 ? 'flex-start' : null,
        alignSelf: 'center',
      }}
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
      renderItem={({item, index}) => (
        <NoteItem item={item} numColumns={numColumns} index={index} />
      )}
    /> */
