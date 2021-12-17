import React from 'react';
import {View} from 'react-native';
import Heading from '../../../../components/Typography/Heading';
import {useTracked} from '../../../../provider';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const ToolbarListFormat = ({selected, formatValue, format}) => {
  const [state] = useTracked();
  const {colors} = state;
  const ordered_lists = {
    default: ['1.', '2.', '3.'],
    'lower-alpha': ['a.', 'b.', 'c.'],
    'lower-greek': ['α.', 'β.', 'γ.'],
    'lower-roman': ['i.', 'ii.', 'iii.'],
    'upper-alpha': ['A.', 'B.', 'C.'],
    'upper-roman': ['I.', 'II.', 'III.'],
  };

  const list = format === 'ol' ? ordered_lists[formatValue] : ["1", "2", "3"];

  return (
    <View>
      {list?.map((item) => (
        <View
          key={item}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: format === 'ol' ? 0 : 2,
            marginTop: format === 'ol' || format === 'cl' ? 0 : 2,
          }}>
          {format === 'ol' ? (
            <Heading
              style={{
                width: 10,
              }}
              color={selected && colors.accent}
              size={6}>
              {item}
            </Heading>
          ) : format === 'cl' ? (
            <Icon
              style={{
                width: 10,
                color: selected ? colors.accent: colors.pri,
              }}
              size={6}
              name="checkbox-marked"
            />
          ) : (
            <View
              style={{
                borderRadius: formatValue === 'square' ? 0 : 100,
                backgroundColor:
                  formatValue !== 'circle'
                    ? selected
                      ? colors.accent
                      : colors.pri
                    : null,
                borderWidth: formatValue === 'circle' ? 0.5 : 0,
                width: 4,
                height: 4,
                marginRight: 5,
              }}
            />
          )}

          <View
            style={{
              width: 18,
              height: 2,
              backgroundColor: selected ? colors.accent : colors.pri,
            }}
          />
        </View>
      ))}
    </View>
  );
};

export default ToolbarListFormat;
