import React from 'react';
import {Text, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import {SIZE} from '../../common/common';
import {
  deleteItems,
  opacity,
  rotate,
  slideLeft,
  slideRight,
} from '../../utils/animations';
import {w} from '../../utils/utils';

export const NotebookPlaceHolder = ({colors, animation}) => {
  return (
    <Animatable.View
      animation={animation}
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
  );
};

export const NotesPlaceHolder = ({colors, animation}) => {
  return (
    <Animatable.View
      animation={animation}
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
  );
};

export const TrashPlaceHolder = ({colors, animation}) => {
  return (
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
  );
};

export const FavoritesPlaceHolder = ({colors, animation}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'space-around',
      }}>
      <Animatable.View
        animation={slideLeft}
        iterationCount="infinite"
        duration={3000}
        iterationDelay={0}
        direction="alternate"
        easing="ease-in"
        useNativeDriver={true}
        style={{
          padding: 5,
          borderRadius: 5,
          marginBottom: 10,
        }}>
        <Icon name="star" size={SIZE.xl} color="orange" />
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
          padding: 5,
          borderRadius: 5,
          marginBottom: 10,
          marginTop: -30,
        }}>
        <Icon name="star" size={SIZE.xxl} color="orange" />
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
          padding: 5,
          borderRadius: 5,
          marginBottom: 10,
        }}>
        <Icon name="star" size={SIZE.xl} color="orange" />
      </Animatable.View>
    </View>
  );
};

export const TagsPlaceHolder = ({colors, animation}) => {
  return (
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
  );
};
