import React, { useState } from 'react';
import { View } from 'react-native';
import { PressableButton } from '../../../../components/ui/pressable';
import Heading from '../../../../components/ui/typography/heading';
import Paragraph from '../../../../components/ui/typography/paragraph';
import { useThemeStore } from '../../../../stores/use-theme-store';
import { eSendEvent } from '../../../../services/event-manager';
import { eCloseProgressDialog } from '../../../../utils/events';
import { SIZE } from '../../../../utils/size';
import { execCommands } from './commands';
import { formatSelection } from './constants';

export const Table = () => {
  const colors = useThemeStore(state => state.colors);
  const [width, setWidth] = useState(400);
  const itemWidth = width / 5;

  const rightCells = [5, 10, 15, 20, 25];
  const bottomCells = [21, 22, 23, 24, 25];
  const cells = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
  ];

  function getRowColumns(index) {
    let columnCount = 5;
    let rowNumber = Math.floor(index / columnCount);
    let columnNumber = index - rowNumber * columnCount;

    return `${rowNumber + 1} x ${columnNumber + 1}`;
  }

  return (
    <View
      onLayout={e => {
        setWidth(e.nativeEvent.layout.width - 24);
      }}
      style={{
        paddingHorizontal: 12
      }}
    >
      <Heading size={SIZE.md}>Select rows x columns</Heading>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          zIndex: 10,
          width: '100%',
          justifyContent: 'center',
          marginTop: 10
        }}
      >
        {cells.map((item, index) => (
          <PressableButton
            key={item.toString()}
            onPress={() => {
              let columnCount = 5;
              let rowNumber = Math.floor(index / columnCount);
              let columnNumber = index - rowNumber * columnCount;
              formatSelection(execCommands.table(rowNumber + 1, columnNumber + 1));
              eSendEvent(eCloseProgressDialog);
            }}
            type="gray"
            customStyle={{
              width: itemWidth,
              height: 35,
              borderWidth: 1,
              borderColor: colors.border,
              marginHorizontal: 0,
              marginVertical: 0,
              borderRadius: 0,
              borderBottomWidth: bottomCells.includes(item) ? 1 : 0,
              borderRightWidth: rightCells.includes(item) ? 1 : 0,
              borderTopLeftRadius: item === 1 ? 5 : 0,
              borderTopRightRadius: item === 5 ? 5 : 0,
              borderBottomLeftRadius: item === 21 ? 5 : 0,
              borderBottomRightRadius: item === 25 ? 5 : 0
            }}
          >
            <Paragraph size={SIZE.sm} color={colors.pri}>
              {getRowColumns(index)}
            </Paragraph>
          </PressableButton>
        ))}
      </View>
    </View>
  );
};
