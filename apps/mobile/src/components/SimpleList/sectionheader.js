import React from 'react';
import {TouchableOpacity, useWindowDimensions, View} from 'react-native';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import {eOpenJumpToDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {HeaderMenu} from '../Header/HeaderMenu';
import Heading from '../Typography/Heading';

export const SectionHeader = ({
  item,
  index,
  headerProps,
  jumpToDialog,
  sortMenuButton,
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const {fontScale} = useWindowDimensions();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 35 * fontScale,
        backgroundColor:colors.nav,
      }}>
      <TouchableOpacity
        onPress={() => {
          eSendEvent(eOpenJumpToDialog);
        }}
        activeOpacity={0.9}
        hitSlop={{top: 10, left: 10, right: 30, bottom: 15}}
        style={{
          height: '100%',
          justifyContent: 'center',
        }}>
        <Heading
          color={colors.accent}
          size={SIZE.sm}
          style={{
            minWidth: 60,
            alignSelf: 'center',
            textAlignVertical: 'center',
          }}>
          {!item.title || item.title === '' ? 'Pinned' : item.title}
        </Heading>
      </TouchableOpacity>
      {index === 0 ? <HeaderMenu /> : null}
    </View>
  );
};
