import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  Platform,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import NoteItem from '../NoteItem';
import {DDS, db} from '../../../App';
import * as Animatable from 'react-native-animatable';
import {useAppContext} from '../../provider/useAppContext';
import Icon from 'react-native-vector-icons/Feather';
import {NotesPlaceHolder} from '../ListPlaceholders';
import {slideRight, slideLeft} from '../../utils/animations';
export const NotesList = ({
  keyword = null,
  notes,
  margin,
  onScroll,
  isSearch = false,
  isGrouped = false,
  isFavorites = false,
  emptyPlaceholderText = '',
  refresh = () => {},
}) => {
  const {colors} = useAppContext();
  const [numColumns, setNumColumns] = useState(1);
  const [pinned, setPinned] = useState([]);

  useEffect(() => {
    let pinnedItems = db.getPinned();

    setPinned([...pinnedItems]);
  }, [notes]);

  return isGrouped && !isSearch ? (
    <SectionList
      sections={notes}
      keyExtractor={(item, index) => item.dateCreated.toString()}
      renderSectionHeader={({section: {title}}) => (
        <Text
          style={{
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.sm,
            color: colors.accent,
            width: DDS.isTab ? '95%' : '90%',
            alignSelf: 'center',
            marginTop: 15,
            paddingBottom: 5,
          }}>
          {title}
        </Text>
      )}
      onScroll={event => {
        y = event.nativeEvent.contentOffset.y;
        onScroll(y);
      }}
      ListEmptyComponent={
        pinned && pinned.length > 0 ? null : (
          <View
            style={{
              height: '80%',
              width: '100%',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}>
            <NotesPlaceHolder animation={slideRight} colors={colors} />
            <NotesPlaceHolder animation={slideLeft} colors={colors} />
            <NotesPlaceHolder animation={slideRight} colors={colors} />
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                marginTop: 20,
              }}>
              Notes you write will appear here.
            </Text>
            <Text
              style={{
                fontSize: SIZE.sm,
                color: colors.icon,
                marginTop: 20,
              }}>
              No notes found
            </Text>
          </View>
        )
      }
      ListHeaderComponent={
        <View
          style={{
            marginTop:
              Platform.OS == 'ios'
                ? notes[0]
                  ? 135
                  : 135 - 60
                : notes[0]
                ? 175
                : 175 - 60,
          }}>
          {pinned && pinned.length > 0 ? (
            <>
              <FlatList
                data={pinned}
                renderItem={({item, index}) => (
                  <NoteItem
                    customStyle={{
                      backgroundColor: colors.shade,
                      width: '100%',
                      paddingHorizontal: '5%',
                      paddingTop: 20,
                      marginBottom: 10,
                      marginTop: 20,
                      borderBottomWidth: 0,
                    }}
                    pinned={true}
                    refresh={() => refresh()}
                    item={item}
                    numColumns={1}
                    index={index}
                  />
                )}
              />
            </>
          ) : null}
        </View>
      }
      contentContainerStyle={{
        width: '100%',
        alignSelf: 'center',
        height: '100%',
      }}
      ListFooterComponent={
        notes[0] ? (
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
        ) : null
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
      //keyExtractor={(item, index) => item.dateCreated.toString()}
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
            marginTop:
              Platform.OS == 'ios'
                ? notes[0]
                  ? 175
                  : 135 - 60
                : notes[0]
                ? 175
                : 175 - 60,
          }}></View>
      }
      contentContainerStyle={{
        width: '100%',
        alignSelf: 'center',
        height: '100%',
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
