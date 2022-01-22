import React from 'react';
import { ScrollView } from 'react-native';
import ColorItem from './coloritem';

const ColorGroup = ({ group }) => {
  return (
    <ScrollView
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      style={{
        flexDirection: 'row',
        width: '100%'
      }}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      horizontal={true}
      contentContainerStyle={{
        alignItems: 'center'
      }}
    >
      {group.data.map(item => (
        <ColorItem key={item.formatValue} value={item.formatValue} format={group.type} />
      ))}
    </ScrollView>
  );
};

export default ColorGroup;
