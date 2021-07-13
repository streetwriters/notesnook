import React, {useEffect, useState} from 'react';
import {TouchableOpacity, useWindowDimensions, View} from 'react-native';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {SORT} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenJumpToDialog, eOpenSortDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';

export const SectionHeader = ({item, index, type}) => {
  const [state] = useTracked();
  const {colors} = state;
  const {fontScale} = useWindowDimensions();
  const [groupOptions, setGroupOptions] = useState(
    db.settings?.getGroupOptions(type),
  );
  let groupBy = Object.keys(SORT).find(
    key => SORT[key] === groupOptions.groupBy,
  );
  groupBy = !groupBy
    ? 'Default'
    : groupBy.slice(0, 1).toUpperCase() + groupBy.slice(1, groupBy.length);

  const onUpdate = () => {
    setGroupOptions({...db.settings?.getGroupOptions(type)});
  };
  useEffect(() => {
    eSubscribeEvent('groupOptionsUpdate', onUpdate);
    return () => {
      eUnSubscribeEvent('groupOptionsUpdate', onUpdate);
    };
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 35 * fontScale,
        backgroundColor: index === 0 ? 'transparent' : colors.nav,
        borderBottomWidth: 1,
        borderBottomColor: index !== 0 ? 'transparent' : colors.accent,
      }}>
      <TouchableOpacity
        onPress={() => {
          eSendEvent(eOpenJumpToDialog,type);
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

      {index === 0 ? (
        <Button
          onPress={() => {
            eSendEvent(eOpenSortDialog,type);
          }}
          title={groupBy}
          icon={
            groupOptions.sortDirection === 'asc'
              ? 'sort-ascending'
              : 'sort-descending'
          }
          height={25}
          style={{
            borderRadius: 100,
          }}
          type="grayBg"
          iconPosition="right"
        />
      ) : null}
    </View>
  );
};
