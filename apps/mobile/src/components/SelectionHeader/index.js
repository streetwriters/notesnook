import React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {w} from '../../utils/utils';

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const SelectionHeader = ({navigation}) => {
  // State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;

  // Render

  return (
    <Animatable.View
      transition={['translateY']}
      duration={700}
      useNativeDriver={true}
      style={{
        width: '100%',
        position: 'absolute',
        height: Platform.OS === 'android' ? 50 + StatusBar.currentHeight : 50,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        justifyContent: 'flex-end',
        zIndex: 999,
        paddingHorizontal: 12,
        transform: [
          {
            translateY: selectionMode ? 0 : -100,
          },
        ],
      }}>
      <View
        style={{
          width: '100%',
          height: 50,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => {
              dispatch({type: ACTIONS.SELECTION_MODE, enabled: !selectionMode});
            }}
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 50,
              marginTop: 2.5,
            }}>
            <Icon
              style={{
                marginLeft: -5,
              }}
              color={colors.pri}
              name={'chevron-left'}
              size={SIZE.xxxl - 3}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: SIZE.lg,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              textAlignVertical: 'center',
            }}>
            {selectedItemsList.length}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Icon
            style={{
              paddingLeft: 25,
            }}
            color={colors.accent}
            name={'plus'}
            size={SIZE.xl}
          />
          <Icon
            style={{
              paddingLeft: 25,
            }}
            color={colors.accent}
            name={'star'}
            size={SIZE.xl - 3}
          />

          <Icon
            style={{
              paddingLeft: 25,
            }}
            color={colors.errorText}
            name={'trash'}
            size={SIZE.xl - 3}
          />
        </View>
      </View>
    </Animatable.View>
  );
};

export default SelectionHeader;
