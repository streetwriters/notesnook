import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import { timeConverter } from '../../utils/TimeUtils';
import Paragraph from '../Typography/Paragraph';

export const DateMeta = ({item}) => {
  const [state] = useTracked();
  const {colors} = state;

  const getNameFromKey = key => {
    switch (key) {
      case 'dateCreated':
        return 'Created at:';
      case 'dateEdited':
        return 'Last edited at:';
      case 'dateDeleted':
        return 'Deleted at:';
      default:
        return key;
    }
  };

  const renderItem = key =>
    key.startsWith('date') && key !== 'dateModified' ? (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 3
        }}>
        <Paragraph size={SIZE.xs} color={colors.icon}>
          {getNameFromKey(key)}
        </Paragraph>
        <Paragraph size={SIZE.xs} color={colors.icon}>
          {timeConverter(item[key])}
        </Paragraph>
      </View>
    ) : null;

  return (
    <View
      style={{
        paddingVertical: 5,
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: colors.nav,
        paddingHorizontal: 12
      }}>
      {Object.keys(item).map(renderItem)}
    </View>
  );
};
