import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../../../provider';
import ToolbarItem from './item';

const ToolbarGroup = ({ group }) => {
  const [state] = useTracked();
  const { colors } = state;

  return (
    <View
      style={{
        borderRadius: 0,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 3,
        overflow: 'hidden'
      }}
    >
      {group.map(item => (
        <ToolbarItem
          key={item.format}
          format={item.format}
          formatValue={item.formatValue}
          type={item.type}
          showTitle={item.showTitle}
          premium={item.premium}
          valueIcon={item.valueIcon}
          group={item.group}
          groupType={item.groupType}
          text={item.textValue || item.text}
          fullname={item.fullname}
        />
      ))}
    </View>
  );
};

export default ToolbarGroup;
