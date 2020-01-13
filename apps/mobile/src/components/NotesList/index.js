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
import {w} from '../../utils/utils';
import SelectionWrapper from '../SelectionWrapper';
export const NotesList = ({
  notes,
  onScroll,
  isSearch = false,
  isGrouped = false,
  refresh = () => {},
}) => {
  const {
    colors,
    selectionMode,
    selectedItemsList,
    changeSelectionMode,
    updateSelectionList,
    pinned,
  } = useAppContext();

  useEffect(() => {
    console.log(notes, pinned);
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
            paddingHorizontal: 12,
            width: '100%',
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
                ? notes[0] && !selectionMode
                  ? 135
                  : 135 - 60
                : notes[0] && !selectionMode
                ? 155
                : 155 - 60,
          }}>
          {pinned && pinned.length > 0 ? (
            <>
              <FlatList
                data={pinned}
                keyExtractor={(item, index) => item.dateCreated.toString()}
                renderItem={({item, index}) =>
                  item.type === 'note' ? (
                    <NoteItem
                      customStyle={{
                        backgroundColor: colors.shade,
                        width: '100%',
                        paddingHorizontal: '5%',
                        paddingTop: 20,
                        marginHorizontal: 0,
                        marginBottom: 10,
                        paddingHorizontal: 12,
                        marginTop: 20,
                        borderBottomWidth: 0,
                      }}
                      pinned={true}
                      item={item}
                      index={index}
                    />
                  ) : null
                }
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
        <SelectionWrapper item={item}>
          <NoteItem
            customStyle={{
              width: selectionMode ? w - 74 : '100%',
              marginHorizontal: 0,
            }}
            onLongPress={() => {
              changeSelectionMode(!selectionMode);
              updateSelectionList(item);
            }}
            item={item}
            index={index}
          />
        </SelectionWrapper>
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
                  ? 135
                  : 135 - 60
                : notes[0]
                ? 155
                : 155 - 60,
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
        <SelectionWrapper item={item}>
          <NoteItem
            customStyle={{
              width: selectionMode ? w - 74 : '100%',
              marginHorizontal: 0,
            }}
            onLongPress={() => {
              changeSelectionMode(!selectionMode);
              updateSelectionList(item);
            }}
            item={item}
            index={index}
          />
        </SelectionWrapper>
      )}
    />
  );
};
