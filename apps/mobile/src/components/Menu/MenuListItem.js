import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {normalize, opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eClearSearch} from '../../services/events';
import {sideMenuRef} from '../../utils/refs';
import {PressableButton} from '../PressableButton';

export const MenuListItem = ({item, index, noTextMode, ignore}) => {
  const [state, dispatch] = useTracked();
  const {currentScreen, colors} = state;

  const _onPress = () => {
    if (!ignore) {
      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: item.name,
        },
      });
      eSendEvent(eClearSearch);
    }

    item.func();
    if (item.close) {
      sideMenuRef.current?.closeDrawer();
    }
  };

  return (
    <PressableButton
      key={item.name + index}
      onPress={_onPress}
      color={
        currentScreen === item.name.toLowerCase() ? colors.shade : 'transparent'
      }
      selectedColor={colors.accent}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={0.12}
      customStyle={{
        width: '100%',
        alignSelf: 'center',
        borderRadius: 0,
        flexDirection: 'row',
        paddingHorizontal: noTextMode ? 0 : 8,
        justifyContent: noTextMode ? 'center' : 'space-between',
        alignItems: 'center',
        paddingBottom: noTextMode ? pv + 2 : normalize(15),
        paddingTop: index === 0 ? pv : noTextMode ? pv + 2 : normalize(15),
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon
          style={{
            minWidth: noTextMode ? 5 : 35,
            textAlignVertical: 'center',
            textAlign: 'left',
          }}
          name={item.icon}
          color={colors.accent}
          size={SIZE.md + 1}
        />
        {noTextMode ? null : (
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
              color: colors.heading,
            }}>
            {item.name}
          </Text>
        )}
      </View>

      {item.switch && !noTextMode ? (
        <Icon
          size={SIZE.lg}
          color={item.on ? colors.accent : colors.icon}
          name={item.on ? 'toggle-switch' : 'toggle-switch-off'}
        />
      ) : undefined}
    </PressableButton>
  );
};
