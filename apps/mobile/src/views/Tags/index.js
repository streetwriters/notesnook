import React, {useEffect, useState} from 'react';
import {View, Text, Dimensions, SafeAreaView, FlatList} from 'react-native';

import {SIZE, pv, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useAppContext} from '../../provider/useAppContext';
import * as Animatable from 'react-native-animatable';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Tags = ({navigation}) => {
  const {colors} = useAppContext();
  const slideRight = {
    0: {
      transform: [{scale: 1}, {translateX: -2}],
    },
    0.5: {
      transform: [{scale: 0.98}, {translateX: 0}],
    },
    1: {
      transform: [{scale: 1.02}, {translateX: 2}],
    },
  };
  const slideLeft = {
    0: {
      transform: [{scale: 1.02}, {translateX: 2}],
    },
    0.5: {
      transform: [{scale: 0.98}, {translateX: 0}],
    },
    1: {
      transform: [{scale: 1}, {translateX: -2}],
    },
  };

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
              <View
                style={{
                  width: w * 0.6,
                  height: 200,

                  justifyContent: 'center',
                  alignItems: 'center',
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 50,
                    top: 60,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.shade,

                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 4,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: SIZE.sm,
                      }}>
                      #
                    </Text>
                    <View
                      style={{
                        width: 40,
                        backgroundColor: colors.accent,
                        height: 12,
                        borderRadius: 100,
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 70,
                    top: 100,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.shade,

                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 4,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: SIZE.sm,
                      }}>
                      #
                    </Text>
                    <View
                      style={{
                        width: 40,
                        backgroundColor: colors.accent,
                        height: 12,
                        borderRadius: 100,
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 120,
                    top: 60,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.shade,

                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 4,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: SIZE.sm,
                      }}>
                      #
                    </Text>
                    <View
                      style={{
                        width: 40,
                        backgroundColor: colors.accent,
                        height: 12,
                        borderRadius: 100,
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 140,
                    top: 100,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.shade,

                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 4,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: SIZE.sm,
                      }}>
                      #
                    </Text>
                    <View
                      style={{
                        width: 40,
                        backgroundColor: colors.accent,
                        height: 12,
                        borderRadius: 100,
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 50,
                    top: 140,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.shade,

                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 4,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: SIZE.sm,
                      }}>
                      #
                    </Text>
                    <View
                      style={{
                        width: 40,
                        backgroundColor: colors.accent,
                        height: 12,
                        borderRadius: 100,
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 120,
                    top: 140,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.shade,

                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 4,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: SIZE.sm,
                      }}>
                      #
                    </Text>
                    <View
                      style={{
                        width: 40,
                        backgroundColor: colors.accent,
                        height: 12,
                        borderRadius: 100,
                      }}
                    />
                  </View>
                </Animatable.View>
              </View>
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
};

Tags.navigationOptions = {
  header: null,
};

export default Tags;
