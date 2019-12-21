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
import {COLOR_SCHEME, SIZE, WEIGHT, ph, pv} from '../../common/common';
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
  isGrouped = false,
  refresh = () => {},
}) => {
  const {colors} = useAppContext();
  const [numColumns, setNumColumns] = useState(1);
  return isGrouped ? (
    <SectionList
      sections={notes}
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
      renderSectionHeader={({section: {title}}) => (
        <Text
          style={{
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.sm,
            color: colors.accent,
            width: DDS.isTab ? '95%' : '90%',
            alignSelf: 'center',
            paddingBottom: 5,
          }}>
          {title}
        </Text>
      )}
      onScroll={event => {
        y = event.nativeEvent.contentOffset.y;
        onScroll(y);
      }}
      ListHeaderComponent={
        <View
          style={{
            marginTop: Platform.OS == 'ios' ? 145 : 185,
          }}>
          {notes[0] ? (
            <>
              <NoteItem
                customStyle={{
                  backgroundColor: colors.navbg,
                  width: '100%',
                  paddingHorizontal: '5%',
                  paddingTop: 20,
                  marginBottom: 10,
                  marginTop: 20,
                  borderBottomWidth: 0,
                }}
                pinned={true}
                item={notes[0].data[0]}
                numColumns={1}
                index={0}
              />
              <NoteItem
                customStyle={{
                  backgroundColor: colors.navbg,
                  width: '100%',
                  paddingHorizontal: '5%',
                  paddingTop: 20,
                  marginBottom: 10,
                  marginTop: 20,
                  borderBottomWidth: 0,
                }}
                pinned={true}
                item={notes[0].data[1]}
                numColumns={1}
                index={0}
              />
            </>
          ) : null}
        </View>
      }
      contentContainerStyle={{
        width: '100%',
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
        <NoteItem
          item={item}
          refresh={() => refresh()}
          numColumns={numColumns}
          index={index}
        />
      )}
    />
  ) : (
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
            marginTop: Platform.OS == 'ios' ? 145 : 185,
          }}></View>
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
            marginTop: 185,
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
