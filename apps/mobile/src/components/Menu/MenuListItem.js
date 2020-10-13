import React from 'react';
import {Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import {eClearSearch} from '../../utils/Events';
import NavigationService from '../../services/Navigation';
import {showContext} from '../../utils';
import {PressableButton} from '../PressableButton';
import {SIZE, WEIGHT} from "../../utils/SizeUtils";
import {DDS} from "../../services/DeviceDetection";

export const MenuListItem = ({item, index, noTextMode, ignore, testID}) => {
  const [state, dispatch] = useTracked();
  const {currentScreen, colors} = state;

  const _onPress = (event) => {
    if (!ignore) {
      dispatch({
        type: Actions.HEADER_TEXT_STATE,
        state: {
          heading: item.name,
        },
      });
      eSendEvent(eClearSearch);
    }

    item.func();
    if (item.close) {
      NavigationService.closeDrawer();
    }
  };

  return (
    <PressableButton
      testID={testID}
      key={item.name + index}
      onPress={_onPress}
      onLongPress={(event) => {
        console.log(event.nativeEvent);
        showContext(event, item.name);
      }}
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
        height: 50,
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
          size={DDS.isTab ? SIZE.md + 5 : SIZE.md + 1}
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
