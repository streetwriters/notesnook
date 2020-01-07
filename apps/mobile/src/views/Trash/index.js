import React, {useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  View,
} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {useAppContext} from '../../provider/useAppContext';
import {db} from '../../../App';
import {NotebookItem} from '../../components/NotebookItem';
import {Dialog} from '../../components/Dialog';
import {ToastEvent} from '../../utils/utils';
import * as Animatable from 'react-native-animatable';
export const Trash = ({navigation}) => {
  const {colors} = useAppContext();
  const [trash, setTrash] = useState([]);
  const [dialog, setDialog] = useState(false);
  useEffect(() => {
    let allTrash = db.getTrash();
    setTrash([...allTrash]);
  }, []);

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

  const rotate = {
    0: {
      transform: [{rotateZ: '0deg'}, {translateX: 0}, {translateY: 0}],
    },
    0.5: {
      transform: [{rotateZ: '25deg'}, {translateX: 10}, {translateY: -20}],
    },
    1: {
      transform: [{rotateZ: '45deg'}, {translateX: 10}, {translateY: -20}],
    },
  };

  const deleteItems = (tX, tY) => {
    return {
      0: {
        transform: [{translateX: tX}, {translateY: tY}],
      },
      0.3: {
        transform: [{translateX: 0}, {translateY: 0}],
      },
      0.5: {
        transform: [{translateX: 0}, {translateY: 50}],
      },
      1: {
        transform: [{translateX: 0}, {translateY: 110}],
      },
    };
  };

  const opacity = {
    0: {
      opacity: 0,
    },

    1: {
      opacity: 1,
    },
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <Dialog
        title="Empty Trash"
        visible={dialog}
        close={() => {
          setDialog(false);
        }}
        icon="trash"
        paragraph="Clearing all trash cannot be undone."
        positiveText="Clear"
        negativeText="Cancel"
        positivePress={async () => {
          await db.clearTrash();
          let allTrash = db.getTrash();
          setTrash([...allTrash]);
          ToastEvent.show('Trash cleared', 'success', 1000, () => {}, '');
          setDialog(false);
        }}
        negativePress={() => {
          setDialog(false);
        }}
      />
      <Header colors={colors} heading="Trash" canGoBack={false} menu={true} />

      <FlatList
        keyExtractor={item => item.dateCreated.toString()}
        style={{
          width: '100%',
          alignSelf: 'center',
          height: '100%',
        }}
        contentContainerStyle={{
          height: '100%',
        }}
        data={trash}
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
            <View
              style={{
                alignItems: 'center',
              }}>
              <Animatable.View
                animation={deleteItems(-50, -100)}
                iterationCount="infinite"
                duration={3000}
                iterationDelay={4500}
                direction="alternate"
                easing="ease-in"
                useNativeDriver={true}
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: colors.errorBg,
                  borderRadius: 5,
                  transform: [
                    {
                      translateX: -50,
                    },
                    {
                      translateY: -100,
                    },
                  ],
                }}
              />
              <Animatable.View
                animation={deleteItems(-80, -70)}
                iterationCount="infinite"
                duration={3000}
                iterationDelay={4500}
                direction="alternate"
                easing="ease-in"
                useNativeDriver={true}
                style={{
                  width: 25,
                  height: 25,
                  backgroundColor: colors.errorBg,
                  borderRadius: 5,
                  transform: [
                    {
                      translateX: -80,
                    },
                    {
                      translateY: -70,
                    },
                  ],
                }}
              />
              <Animatable.View
                animation={deleteItems(-120, -50)}
                iterationCount="infinite"
                duration={3000}
                iterationDelay={4500}
                direction="alternate"
                easing="ease-in"
                useNativeDriver={true}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: colors.errorBg,
                  borderRadius: 5,
                  transform: [
                    {
                      translateX: -120,
                    },
                    {
                      translateY: -50,
                    },
                  ],
                }}
              />

              <Animatable.View
                animation={deleteItems(-120, -140)}
                iterationCount="infinite"
                duration={3000}
                iterationDelay={4500}
                direction="alternate"
                easing="ease-in"
                useNativeDriver={true}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: colors.errorBg,
                  borderRadius: 5,
                  transform: [
                    {
                      translateX: -120,
                    },
                    {
                      translateY: -140,
                    },
                  ],
                }}
              />

              <Animatable.View
                animation={rotate}
                iterationCount="infinite"
                duration={3000}
                iterationDelay={3500}
                direction="alternate"
                easing="ease-in"
                useNativeDriver={true}
                style={{
                  width: 100,
                  height: 15,
                  backgroundColor: colors.accent,
                  borderRadius: 100,
                  marginBottom: 2,
                  alignItems: 'center',
                  zIndex: 10,
                }}>
                <View
                  style={{
                    width: 25,
                    height: 10,
                    backgroundColor: colors.accent,
                    borderTopRightRadius: 5,
                    borderTopLeftRadius: 5,
                    marginBottom: 2,
                    marginTop: -9,
                  }}
                />
              </Animatable.View>

              <View
                style={{
                  backgroundColor: 'white',
                }}>
                <View
                  style={{
                    width: 80,
                    height: 100,
                    backgroundColor: colors.shade,
                    borderRadius: 5,
                    zIndex: 10,
                  }}>
                  <Animatable.View
                    animation={opacity}
                    iterationCount="infinite"
                    duration={3000}
                    iterationDelay={4500}
                    direction="alternate"
                    easing="ease-in"
                    useNativeDriver={true}
                    style={{
                      flexDirection: 'row',
                      width: '90%',
                      alignSelf: 'center',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      height: '100%',
                    }}>
                    <View
                      style={{
                        width: 12,
                        height: 80,
                        backgroundColor: colors.accent,
                        borderRadius: 5,
                        zIndex: 10,
                      }}
                    />
                    <View
                      style={{
                        width: 12,
                        height: 80,
                        backgroundColor: colors.accent,
                        borderRadius: 5,
                        zIndex: 10,
                      }}
                    />
                    <View
                      style={{
                        width: 12,
                        height: 80,
                        backgroundColor: colors.accent,
                        borderRadius: 5,
                        zIndex: 10,
                      }}
                    />
                  </Animatable.View>
                </View>
              </View>
            </View>

            {/* 

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
              <Icon
                name="trash"
                size={SIZE.xl}
                color={colors.accent}
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 0,
                }}
              />
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
              <Icon
                name="trash"
                size={SIZE.xl}
                color={colors.accent}
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 0,
                }}
              />
              <View
                style={{
                  width: '50%',
                  height: 15,
                  borderRadius: 100,
                  backgroundColor: colors.accent,
                  marginBottom: 8,
                }}
              />
              <View
                style={{
                  width: '70%',
                  height: 10,

                  marginBottom: 8,
                  flexDirection: 'row',
                }}>
                <View
                  style={{
                    width: '30%',
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.accent,
                    marginRight: 8,
                  }}
                />
                <View
                  style={{
                    width: '30%',
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.accent,
                    marginRight: 8,
                  }}
                />
                <View
                  style={{
                    width: '30%',
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.accent,
                    marginRight: 8,
                  }}
                />
              </View>
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
              <Icon
                name="trash"
                size={SIZE.xl}
                color={colors.accent}
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 0,
                }}
              />
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

            
             */}

            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                marginTop: 20,
              }}>
              Deleted notes & notebooks appear here.
            </Text>
            <Text
              style={{
                fontSize: SIZE.sm,
                color: colors.icon,
                marginTop: 20,
              }}>
              Trash is empty
            </Text>
          </View>
        }
        renderItem={({item, index}) =>
          item.type === 'note' ? (
            <NoteItem item={item} index={index} isTrash={true} />
          ) : (
            <NotebookItem item={item} isTrash={true} index={index} />
          )
        }
      />
      <TouchableOpacity
        activeOpacity={opacity}
        onPress={() => {
          setDialog(true);
        }}
        style={{
          borderRadius: 5,
          width: '90%',
          marginHorizontal: '5%',
          paddingHorizontal: ph,
          paddingVertical: pv + 5,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginBottom: 20,
          backgroundColor: colors.accent,
        }}>
        <Icon name="trash" color="white" size={SIZE.lg} />
        <Text
          style={{
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
            color: 'white',
          }}>
          {'  '}Clear all trash
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
