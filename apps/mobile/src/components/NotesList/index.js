import React, {useState} from 'react';
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
import {DDS} from '../../../App';
import * as Animatable from 'react-native-animatable';
import {useAppContext} from '../../provider/useAppContext';
import Icon from 'react-native-vector-icons/Feather';
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

  const slideRight = {
    0: {
      transform: [{translateX: -4}],
    },
    0.5: {
      transform: [{translateX: 0}],
    },
    1: {
      transform: [{translateX: 4}],
    },
  };
  const slideLeft = {
    0: {
      transform: [{translateX: 4}],
    },
    0.5: {
      transform: [{translateX: 0}],
    },
    1: {
      transform: [{translateX: -4}],
    },
  };

  return isGrouped ? (
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
        <View
          style={{
            height: '80%',
            width: '100%',
            alignItems: 'center',
            alignSelf: 'center',
            justifyContent: 'center',
            opacity: 0.8,
          }}>
          <Animatable.View
            animation={slideRight}
            iterationCount="infinite"
            duration={3000}
            iterationDelay={0}
            direction="alternate"
            easing="ease-in"
            useNativeDriver={true}
            style={{
              backgroundColor: colors.shade,
              width: '50%',
              padding: 5,
              borderRadius: 5,
              marginBottom: 10,
            }}>
            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: '70%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                  marginRight: '5%',
                }}
              />
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                }}
              />
            </View>
          </Animatable.View>

          <Animatable.View
            animation={slideLeft}
            iterationCount="infinite"
            duration={3000}
            easing="ease-in"
            iterationDelay={0}
            direction="alternate"
            useNativeDriver={true}
            style={{
              backgroundColor: colors.shade,
              width: '50%',
              padding: 5,
              borderRadius: 5,
              marginBottom: 10,
            }}>
            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: '70%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                  marginRight: '5%',
                }}
              />
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                }}
              />
            </View>
          </Animatable.View>
          <Animatable.View
            easing="ease-in"
            animation={slideRight}
            iterationCount="infinite"
            duration={3000}
            useNativeDriver={true}
            iterationDelay={0}
            direction="alternate"
            style={{
              backgroundColor: colors.shade,
              width: '50%',
              padding: 5,
              borderRadius: 5,
              marginBottom: 10,
            }}>
            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: '70%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                  marginRight: '5%',
                }}
              />
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                }}
              />
            </View>
          </Animatable.View>

          <Text
            style={{
              color: colors.icon,
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              marginTop: 20,
            }}>
            Notes you write show up here.
          </Text>
        </View>
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
          {notes[0] ? (
            <>
              {/* <NoteItem
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
                item={notes[0].data[0]}
                numColumns={1}
                index={0}
              />
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
                item={notes[0].data[1]}
                numColumns={1}
                index={0}
              /> */}
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
          <Animatable.View
            animation={slideRight}
            iterationCount="infinite"
            duration={3000}
            iterationDelay={0}
            direction="alternate"
            easing="ease-in"
            useNativeDriver={true}
            style={{
              backgroundColor: colors.shade,
              width: '50%',
              padding: 5,
              borderRadius: 5,
              marginBottom: 10,
            }}>
            {isFavorites ? (
              <Icon
                name="star"
                size={SIZE.xl}
                color={colors.accent}
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 0,
                }}
              />
            ) : null}

            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: '70%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                  marginRight: '5%',
                }}
              />
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                }}
              />
            </View>
          </Animatable.View>

          <Animatable.View
            animation={slideLeft}
            iterationCount="infinite"
            duration={3000}
            iterationDelay={0}
            direction="alternate"
            easing="ease-in"
            useNativeDriver={true}
            style={{
              backgroundColor: colors.shade,
              width: '50%',
              padding: 5,
              borderRadius: 5,
              marginBottom: 10,
            }}>
            {isFavorites ? (
              <Icon
                name="star"
                size={SIZE.xl}
                color={colors.accent}
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 0,
                }}
              />
            ) : null}

            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: '70%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                  marginRight: '5%',
                }}
              />
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                }}
              />
            </View>
          </Animatable.View>
          <Animatable.View
            animation={slideRight}
            iterationCount="infinite"
            duration={3000}
            iterationDelay={0}
            direction="alternate"
            easing="ease-in"
            useNativeDriver={true}
            style={{
              backgroundColor: colors.shade,
              width: '50%',
              padding: 5,
              borderRadius: 5,
              marginBottom: 10,
            }}>
            {isFavorites ? (
              <Icon
                name="star"
                size={SIZE.xl}
                color={colors.accent}
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 0,
                }}
              />
            ) : null}

            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: '70%',
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                  marginRight: '5%',
                }}
              />
              <View
                style={{
                  width: '15%',
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: colors.icon,
                }}
              />
            </View>
          </Animatable.View>

          <Text
            style={{
              color: colors.pri,
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              marginTop: 20,
            }}>
            {emptyPlaceholderText}
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
