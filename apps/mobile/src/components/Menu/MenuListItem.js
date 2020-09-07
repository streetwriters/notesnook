import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {normalize, opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eClearSearch} from '../../services/events';
import {sideMenuRef} from '../../utils/refs';

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
    <TouchableOpacity
      key={item.name}
      activeOpacity={opacity / 2}
      onPress={_onPress}
      style={{
        width: '100%',
        backgroundColor:
          item.name.toLowerCase() === currentScreen
            ? colors.shade
            : 'transparent',
        alignSelf: 'center',
        flexDirection: 'row',
        paddingHorizontal: noTextMode ? 0 : 12,
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
    </TouchableOpacity>
  );
};
